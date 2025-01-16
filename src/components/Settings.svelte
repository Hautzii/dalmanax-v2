<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { preferences } from '$lib/stores/almanaxStore';
    import { fetchAlmanaxData } from '$lib/api/almanax';
    import type { AlmanaxState } from '$lib/types/AlmanaxState';
    let { items, onLevelUpdate, initialLevel } = $props<{ 
        items: AlmanaxState[], 
        onLevelUpdate: (items: AlmanaxState[], level: number) => void,
        initialLevel: number
    }>();
    let userLevel = $state(initialLevel);
    let inputLevel = $state(initialLevel);
    let showModal = $state(false);

    const updateLevel = async (newLevel: number) => {
        userLevel = newLevel;
        $preferences.level = newLevel;
        if (browser) {
            localStorage.setItem('level', newLevel.toString());
        }
        const newItems = await fetchAlmanaxData(newLevel);
        onLevelUpdate(newItems, newLevel);
    };

    onMount(() => {
        if (browser) {
            const storedLevel = localStorage.getItem('level');
            if (storedLevel) {
                userLevel = parseInt(storedLevel);
                inputLevel = parseInt(storedLevel);
            }
        }
    });
</script>

<div>
    <!-- svelte-ignore event_directive_deprecated -->
    <button on:click={() => showModal = true} class="settings-button">
        <img src="/settings.svg" alt="Settings" class="w-6 h-6">
    </button>

    {#if showModal}
        <div class="modal z-[1500]">
            <div class="modal-content">
                <label for="level" class="text-[#ffffe6]">Level:</label>
                <input type="number" id="level" min="1" max="200" bind:value={inputLevel} class="w-[50px] text-black rounded-md" />
                <!-- svelte-ignore event_directive_deprecated -->
                <button on:click={() => { updateLevel(inputLevel); showModal = false; }} class="mt-2 bg-white p-1 text-black rounded-md">Update Level</button>
                <!-- svelte-ignore event_directive_deprecated -->
                <button on:click={() => showModal = false} class="mt-2 bg-red-500 p-1 text-white rounded-md">Close</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .modal-content {
        background: #1e1e1e;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
</style>