<script lang="ts">
	import type { AlmanaxState } from '$lib/types/AlmanaxState';
	import { loot, rewards, today, tomorrow, in2d, in3d, in4d, in5d, in6d, in7d } from '$lib/paraglide/messages';
	import { languageTag } from '$lib/paraglide/runtime';
	import { onMount } from 'svelte';
	import Toast from './Toast.svelte';

	let { items }: { items: AlmanaxState[] } = $props<{ items: AlmanaxState[], userLevel: number, isAccountProtected: boolean }>();	
	let currentIndex = $state(0);
	let touchStartY = 0;
	let touchProcessed = false;
	let isNavigating = false;
	let showToast = $state(false);
	let cardHeight = $state(0);
	let windowWidth = $state(window.innerWidth);
	let imagesLoaded = $state(new Set());
	let dateLabels: string[] = $state([]);

	type TranslatedItem = AlmanaxState & { loot_text: string; rewards_text: string };
	let translatedItems: TranslatedItem[] = $state([]);

	const capitalizeFirstLetter = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr);
		const lang = languageTag() || 'fr';
		return capitalizeFirstLetter(
			date.toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' })
		);
	};

	const formatNumberWithSpaces = (num: number): string => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

	const copyToClipboard = async (text: string): Promise<void> => {
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				const textArea = Object.assign(document.createElement('textarea'), { value: text });
				document.body.append(textArea);
				textArea.select();
				document.execCommand('copy');
				textArea.remove();
			}
			showToast = true;
			setTimeout(() => (showToast = false), 2000);
		} catch (error) {
			console.error('Failed to copy text:', error);
		}
	};

	const isMobileDevice = (): boolean => windowWidth <= 768;

	const getMobileOffset = (height: number): number => {
		if (windowWidth <= 768) return Math.max(0, (400 - height) / 2);
		if (windowWidth >= 700 && windowWidth <= 1300) return 32;
		if (windowWidth > 1300) return 64;
		return 96;
	};

	const handleClick = (e: MouseEvent | TouchEvent, index: number): void => {
		if (isNavigating) return;
		const displayIndex = getDisplayIndex(index);

		if (displayIndex !== 0) {
			isNavigating = true;
			currentIndex = index;
			setTimeout(() => (isNavigating = false), 300);
		}
	};

	// Handle touch start events
	const handleTouchStart = (e: TouchEvent): void => {
		e.preventDefault();
		touchStartY = e.touches[0].clientY;
		touchProcessed = false;
	};

	const handleTouchMove = (e: TouchEvent): void => {
		if (!isMobileDevice() || isNavigating || touchProcessed) return;
		e.preventDefault();

		const touchEndY = e.touches[0].clientY;
		const deltaY = touchEndY - touchStartY;

		if (Math.abs(deltaY) > 50) {
			touchProcessed = true;
			currentIndex = deltaY > 0 
				? (currentIndex + 1) % items.length 
				: (currentIndex - 1 + items.length) % items.length;
		}
	};

	const handleTouchEnd = (e: TouchEvent): void => {
		if (!touchProcessed && !isNavigating) {
			const touch = e.changedTouches[0];
			const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
			const cardElement = element.closest('.cards-container');

			if (cardElement) {
				const indexAttr = cardElement.getAttribute('data-index');
				if (indexAttr) handleClick(e, parseInt(indexAttr));
			}
		}
		touchProcessed = false;
	};

	const handleWheel = (e: WheelEvent): void => {
		if (isMobileDevice() || Math.abs(e.deltaY) < 25 || isNavigating) return;
		isNavigating = true;

		currentIndex = e.deltaY < 0 
			? (currentIndex < items.length - 1 ? currentIndex + 1 : 0) 
			: (currentIndex > 0 ? currentIndex - 1 : items.length - 1);

		setTimeout(() => (isNavigating = false), 300);
	};

	const getVisibleCards = (index: number, currentIndex: number): boolean => {
		const normalizedCurrent = ((currentIndex % items.length) + items.length) % items.length;
		const normalizedIndex = ((index % items.length) + items.length) % items.length;

		const distance = Math.min(
			Math.abs(normalizedIndex - normalizedCurrent),
			Math.abs(normalizedIndex - normalizedCurrent + items.length),
			Math.abs(normalizedIndex - normalizedCurrent - items.length)
		);

		return windowWidth <= 768 ? distance <= 2 : windowWidth >= 1600 ? distance <= 4 : distance <= 3;
	};

	const getDisplayIndex = (index: number): number => {
		const normalizedCurrent = ((currentIndex % items.length) + items.length) % items.length;
		const normalizedIndex = ((index % items.length) + items.length) % items.length;

		let distance = normalizedIndex - normalizedCurrent;
		if (distance > items.length / 2) distance -= items.length;
		if (distance < -items.length / 2) distance += items.length;

		return distance;
	};

	const getDateLabel = (index: number): string => {
		const labels = [today(), tomorrow(), in2d(), in3d(), in4d(), in5d(), in6d(), in7d()];
		return labels[index] || '';
	};

	$effect(() => {
		translatedItems = items.map((item: AlmanaxState) => ({
			...item,
			loot_text: loot(),
			rewards_text: rewards(),
		}));
	});

	$effect(() => {
		dateLabels = items.map((_, index) => getDateLabel(index)).filter((label): label is string => label !== undefined);
	});

	onMount(() => {
		const handleResize = () => (windowWidth = window.innerWidth);
		window.addEventListener('resize', handleResize);

		items.forEach((item: AlmanaxState) => {
			const img = new Image();
			img.onload = () => imagesLoaded.add(item.image);
			img.src = item.image;
		});

		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<!-- svelte-ignore event_directive_deprecated -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="cards-container relative flex w-[90vw] items-center justify-center md:w-[65vw]"
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
	on:touchcancel={handleTouchEnd}
	on:wheel={handleWheel}
>
	{#each translatedItems as item, index}
		{#if getVisibleCards(index, currentIndex)}
			{@const displayIndex = getDisplayIndex(index)}
			<div
				on:click={(e) => handleClick(e, index)}
				data-index={index}
				class="cards-container absolute flex h-[250px] w-full transform {displayIndex !== 0
					? 'cursor-pointer'
					: ''} touch-none select-none transition-all duration-500"
				style="
        			transform: translateY({-displayIndex *
					(windowWidth <= 768 ? 60 : windowWidth <= 1300 ? 65 : windowWidth <= 1600 ? 70 : 80)}px)
					scale({1 - Math.abs(displayIndex) * 0.05});
        			opacity: {1 - Math.abs(displayIndex) * 0.15};
        			z-index: {998 - Math.abs(displayIndex)};
        			top: 50%;
        			left: 50%;
        			transform-origin: center;
        			margin-top: {windowWidth <= 768 ? '-200px' : '-140px'};
        			margin-left: -50%;
"
			>
				<div
					bind:clientHeight={cardHeight}
					class="flex min-h-0 w-full gap-6 rounded-xl bg-[#1e1e1e] p-4 shadow-lg md:p-8"
					style="margin-top: calc(-{getMobileOffset(cardHeight)}px);"
				>
					<div class="flex h-full w-full flex-col justify-between gap-4 md:flex-row md:gap-8">
						<div class="flex flex-col gap-4 overflow-hidden md:flex-1 md:gap-6">
							{#if displayIndex !== 0}
								<div class="text-center text-lg font-semibold transition-opacity duration-200 md:text-left" style:opacity={displayIndex !== 0 ? 1 : 0}>
									<p style="display: inline; margin-right: 8px;">{formatDate(item.date)}</p>
									<span class="date-label ml-2 rounded-xl px-2 py-1 text-xs font-semibold">
										{dateLabels[index]}
									</span>
									<span class="bonus-label ml-2 rounded-xl px-2 py-1 text-xs font-semibold">
										{item.bonus}
									</span>
								</div>
							{/if}
							<div class="md flex flex-1 flex-col justify-center">
								<div
									class="space-y-3 transition-opacity duration-200"
									style:opacity={displayIndex === 0 ? 1 : 0}
								>
								{#if displayIndex === 0}
									<p class="text-center text-lg font-semibold md:flex md:items-center md:text-left">
										{formatDate(item.date)}
										<span class="date-label ml-2 rounded-xl px-2 py-1 text-xs font-semibold">
											{dateLabels[index]}
										</span>
										<span class="bonus-label ml-2 rounded-xl px-2 py-1 text-xs font-semibold">
											{item.bonus}
										</span>
									</p>
								{/if}
									<p
										class="description line-clamp-6 text-center text-sm font-semibold transition-opacity duration-200 md:text-left md:text-base"
										style:opacity={displayIndex === 0 ? 1 : 0}
									>
										{item.description}
									</p>
									<div class="text-center text-sm md:text-left md:text-base">
										{item.loot_text}:
										<span class="font-semibold">{item.quantity}x</span>
										<button
											class="cursor-pointer font-semibold transition-colors hover:text-[#f15a22]"
											on:click|stopPropagation={() => copyToClipboard(item.loot)}
										>
											{item.loot}
										</button>
									</div>
									<div class="text-center text-sm font-semibold md:text-left md:text-base">
										<p>
											{item.rewards_text}:
											<span class="font-semibold">{formatNumberWithSpaces(item.reward_kamas)}</span>
											<img src="/kamas.webp" alt="Kamas" class="kamas -mb-1 inline-block h-4 w-4 md:mb-1" />
											<span class="font-semibold">/ {formatNumberWithSpaces(item.reward_xp)} XP</span>
										</p>
									</div>
								</div>
							</div>
						</div>
						<div class="flex flex-1 shrink-0 items-center justify-center md:flex-none">
							<img
								src={item.image}
								alt={item.loot}
								class="h-24 w-24 object-contain md:h-40 md:w-40"
								style:opacity={displayIndex === 0 ? 1 : 0.2}
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/each}
</div>

{#if showToast}
	<Toast />
{/if}

<style>
	.date-label {
		background-color: #f15a22;
	}
	.bonus-label {
		background-color: #acb739;
	}
	@media screen and (max-width: 768px) {
		.cards-container {
			height: 275px;
			touch-action: none;
		}
		.description {
			max-width: 100%;
			-webkit-line-clamp: 5;
			line-clamp: 3;
			font-size: 0.875rem;
			line-height: 1.25rem;
		}
		img {
			height: 76px;
			width: 76px;
			margin-top: -0.5rem;
		}
		.kamas {
			height: 16px;
			width: 16px;
		}
		.flex-col {
			gap: 0.75rem;
		}
		.date-label,
		.bonus-label {
			display: none;
		}
	}

	@media screen and (min-width: 768px) and (max-width: 1300px) {
		.cards-container {
			height: 250px;
		}
		.description {
			max-width: 550px;
		}
	}

	@media screen and (min-width: 1300px) {
		.description {
			max-width: 650px;
		}
	}
</style>