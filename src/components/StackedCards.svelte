<script lang="ts">
	import type { AlmanaxState } from '$lib/types/AlmanaxState';
	import { loot, rewards, today, tomorrow, in2d, in3d, in4d, in5d, in6d, in7d, level } from '$lib/paraglide/messages';
	import { languageTag } from '$lib/paraglide/runtime';
	import { onMount } from 'svelte';
	import Toast from './Toast.svelte';

	let { items, userLevel } = $props<{ items: AlmanaxState[], userLevel: number }>();
	let currentIndex = $state(0);
	let touchStartY = 0;
	let touchProcessed = false;
	let isNavigating = false;
	let showToast = $state(false);
	let cardHeight = $state(0);
	let windowWidth = $state(window.innerWidth);
	let imagesLoaded = $state(new Set());
	const ANIMATION_DURATION = 300;
	const TOAST_DURATION = 2000;
	const MAX_MOBILE_HEIGHT = 400;

	const capitalizeFirstLetter = (str: string) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const lang = languageTag() || 'fr';
		return capitalizeFirstLetter(
			date.toLocaleDateString(lang, {
				weekday: 'long',
				month: 'long',
				day: 'numeric'
			})
		);
	};

	const formatNumberWithSpaces = (num: number) => {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	};

	const copyToClipboard = async (text: string) => {
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
			} else {
				const textArea = document.createElement('textarea');
				textArea.value = text;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				try {
					document.execCommand('copy');
				} finally {
					textArea.remove();
				}
			}
			showToast = true;
			setTimeout(() => {
				showToast = false;
			}, TOAST_DURATION);
		} catch (error) {
			console.error('Failed to copy text:', error);
		}
	};

	const isMobileDevice = () => windowWidth <= 768;

	const getMobileOffset = (height: number) => {
		if (windowWidth <= 768) {
			const offset = Math.max(0, (MAX_MOBILE_HEIGHT - height) / 2);
			return offset;
		}
		if (windowWidth >= 700 && windowWidth <= 1300) {
			return 32;
		}
		if (windowWidth > 1300) {
			return 64;
		}
		return 96;
	};

	const handleClick = (e: MouseEvent | TouchEvent, index: number) => {
		if (isNavigating) return;
		const displayIndex = getDisplayIndex(index);

		if (displayIndex !== 0) {
			isNavigating = true;
			currentIndex = index;
			setTimeout(() => {
				isNavigating = false;
			}, ANIMATION_DURATION);
		}
	};

	const handleTouchStart = (e: TouchEvent) => {
		e.preventDefault();
		touchStartY = e.touches[0].clientY;
		touchProcessed = false;
	};

	const handleTouchMove = (e: TouchEvent) => {
		if (!isMobileDevice()) return;
		if (isNavigating || touchProcessed) return;
		e.preventDefault();

		const touchEndY = e.touches[0].clientY;
		const deltaY = touchEndY - touchStartY;

		if (Math.abs(deltaY) > 50) {
			touchProcessed = true;
			if (deltaY > 0) {
				currentIndex = (currentIndex + 1) % items.length;
			} else {
				currentIndex = (currentIndex - 1 + items.length) % items.length;
			}
		}
	};

	const handleTouchEnd = (e: TouchEvent) => {
		if (!touchProcessed && !isNavigating) {
			const touch = e.changedTouches[0];
			const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
			const cardElement = element.closest('.cards-container');

			if (cardElement) {
				const indexAttr = cardElement.getAttribute('data-index');
				if (indexAttr) {
					handleClick(e, parseInt(indexAttr));
				}
			}
		}
		touchProcessed = false;
	};

	const handleWheel = (e: WheelEvent) => {
		if (isMobileDevice()) return;
		if (Math.abs(e.deltaY) < 25 || isNavigating) return;
		isNavigating = true;

		if (e.deltaY < 0) {
			if (currentIndex < items.length - 1) currentIndex++;
			else currentIndex = 0;
		} else {
			if (currentIndex > 0) currentIndex--;
			else currentIndex = items.length - 1;
		}
		setTimeout(() => (isNavigating = false), ANIMATION_DURATION);
	};

	const getVisibleCards = (index: number, currentIndex: number) => {
		const normalizedCurrent = ((currentIndex % items.length) + items.length) % items.length;
		const normalizedIndex = ((index % items.length) + items.length) % items.length;

		const distance = Math.min(
			Math.abs(normalizedIndex - normalizedCurrent),
			Math.abs(normalizedIndex - normalizedCurrent + items.length),
			Math.abs(normalizedIndex - normalizedCurrent - items.length)
		);

		return windowWidth <= 768 ? distance <= 2 : windowWidth >= 1600 ? distance <= 4 : distance <= 3;
	};

	const getDisplayIndex = (index: number) => {
		const normalizedCurrent = ((currentIndex % items.length) + items.length) % items.length;
		const normalizedIndex = ((index % items.length) + items.length) % items.length;

		let distance = normalizedIndex - normalizedCurrent;
		if (distance > items.length / 2) distance -= items.length;
		if (distance < -items.length / 2) distance += items.length;

		return distance;
	};

	onMount(() => {
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};

		items.forEach((item: any) => {
			const img = new Image();
			img.onload = () => {
				imagesLoaded.add(item.image);
			};
			img.src = item.image;
		});

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
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
	{#each items as item, index}
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
								<div
									class="text-center text-lg font-semibold transition-opacity duration-200 md:text-left"
									style:opacity={displayIndex !== 0 ? 1 : 0}
								>
									{formatDate(item.date)}
								</div>
							{/if}
							<div class="md flex flex-1 flex-col justify-center">
								<div
									class="space-y-3 transition-opacity duration-200"
									style:opacity={displayIndex === 0 ? 1 : 0}
								>
									{#if displayIndex === 0}
										{#if index === 0}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{today()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 1}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{tomorrow()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 2}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{in2d()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 3}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{in3d()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 4}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{in4d()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 5}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{in5d()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 6}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{in6d()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{:else if index === 7}
											<p
												class="text-center text-lg font-semibold md:flex md:items-center md:text-left"
											>
												{formatDate(item.date)}
												<span
													class="date-label ml-2 rounded-xl bg-[#f15a22] px-2 py-1 text-xs font-semibold"
													>{in7d()}</span
												>
												<span
													class="bonus-label ml-2 rounded-xl bg-[#acb739] px-2 py-1 text-xs font-semibold"
												>
													{item.bonus}
												</span>
											</p>
										{/if}
									{/if}
									<p
										class="description line-clamp-6 text-center text-sm font-semibold transition-opacity duration-200 md:text-left md:text-base"
										style:opacity={displayIndex === 0 ? 1 : 0}
									>
										{item.description}
									</p>
									<div class="text-center text-sm md:text-left md:text-base">
										{loot()}:
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
											{rewards()}:
											<span class="font-semibold">{formatNumberWithSpaces(item.reward_kamas)}</span>
											<img
												src="/kamas.webp"
												alt="Kamas"
												class="kamas -mb-1 inline-block h-4 w-4 md:mb-1"
											/>
											<span class="font-semibold">/ {formatNumberWithSpaces(item.reward_xp)} XP ({level()} {userLevel})</span>
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
