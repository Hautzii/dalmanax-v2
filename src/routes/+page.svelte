	<script lang="ts">
	import StackedCards from '../components/StackedCards.svelte';
	import Settings from '../components/Settings.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { fly } from 'svelte/transition';
	import '../app.postcss';
	import type { AlmanaxState } from '$lib/types/AlmanaxState';
	import { PUBLIC_DATA_WEBSITE_ID } from '$env/static/public';

	const { data } = $props<{ data: { items: AlmanaxState[] } }>();
	let items = $state(data.items);
	let mounted = $state(false);
	let userLevel = $state(0);
	let isAccountProtected = $state(true);

	onMount(() => {
		if (browser) {
			const storedLevel = localStorage.getItem('level');
			if (storedLevel) {
				userLevel = parseInt(storedLevel);
			}
		}
		const script = document.createElement('script');
		script.defer = true;
		script.src = '/script.js';
		script.setAttribute('data-website-id', PUBLIC_DATA_WEBSITE_ID);
		document.head.appendChild(script);
		mounted = true;
	});
</script>

<svelte:head>
	<link 
		rel="preload" 
		href="https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu173w5aXp-p7K4KLg.woff2" 
		as="font" 
		type="font/woff2" 
	>
</svelte:head>

<ParaglideJS {i18n}>
	<div class="h-screen bg-[#10100e] font-['Montserrat'] text-base overflow-hidden">
		{#if mounted}
		<div class="flex items-center justify-center py-4" transition:fly={{ y: 20, duration: 1000 }}>
			<img 
				src="/Dolmanax.webp" 
				alt="logo" 
				class="w-16 h-16"
			>
			<h1 
				class="text-3xl font-semibold text-[#ffffe6]"
				style:content-visibility="auto"
			>
				Dalmanax
			</h1>
			<div class="mt-2.5 ml-2.5">
				<Settings {items} initialLevel={userLevel} onLevelUpdate={(newItems, level) => { items = newItems; userLevel = level; }} isAccountProtected={isAccountProtected} />
			</div>
		</div>
		{/if}
		{#if mounted}
			<main class="h-[calc(100vh-theme(spacing.16))] container mx-auto px-4 overflow-hidden" transition:fly={{ y: 20, duration: 1000 }}>
				<div class="flex h-screen flex-col text-[#ffffe6]">
					<div class="flex flex-1 items-center justify-center">
						<StackedCards {items} userLevel={userLevel} isAccountProtected={isAccountProtected} />
					</div>
				</div>
			</main>
		{:else}
			<div class="flex h-screen bg-[#10100e] font-['Montserrat'] text-base items-center justify-center overflow-hidden">
				<!-- svelte-ignore element_invalid_self_closing_tag -->
				<div class="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-[#ffffe6]" />
			</div>
		{/if}
	</div>
</ParaglideJS>
