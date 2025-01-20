<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { browser } from '$app/environment';
    import { level, settings, language, protected_account } from '$lib/paraglide/messages';
    import { setLanguageTag, languageTag } from '$lib/paraglide/runtime';
    import { preferences } from '$lib/stores/almanaxStore';
    import { fetchAlmanaxData } from '$lib/api/almanax';
    import type { AlmanaxState } from '$lib/types/AlmanaxState';
    import type { Preferences } from '$lib/types/Preferences';
    
    let { onLevelUpdate, initialLevel = 150, initialLanguage = 'fr', isAccountProtected = true } = $props<{ 
        items: AlmanaxState[], 
        onLevelUpdate: (items: AlmanaxState[], level: number) => void,
        initialLevel: number,
        initialLanguage?: string,
        isAccountProtected?: boolean
    }>();
    
    let userLevel = $state(initialLevel);
    let inputLevel = $state(initialLevel);
    let showModal = $state(false);
    let inputLanguage = $state<"en" | "fr" | "es" | "de">(initialLanguage as "fr");
    
    const updatePreferences = async (updates: Preferences) => {
        preferences.update(current => {
            const updatedPreferences = { ...current, ...updates };
            localStorage.setItem('level', updatedPreferences.level.toString());
            localStorage.setItem('selectedLanguage', updatedPreferences.language);
            localStorage.setItem('isAccountProtected', updatedPreferences.isAccountProtected.toString());
            return updatedPreferences;
        });
        const newItems = await fetchAlmanaxData(userLevel, inputLanguage);
        onLevelUpdate(newItems, userLevel);
    };
    
    const applyXPBoost = (items: AlmanaxState[]) => {
        if (isAccountProtected) {
            return items.map(item => ({
                ...item,
                reward_xp: Math.round(item.reward_xp * 1.05)
            }));
        }
        return items;
    };
    
    const updateLevel = async (newLevel: number) => {
        userLevel = newLevel;
        inputLevel = newLevel;
        const validLanguages = ["en", "fr", "es", "de"] as const;
        if (validLanguages.includes(inputLanguage)) {
            updatePreferences({ level: newLevel, language: inputLanguage, isAccountProtected });
        } else {
            throw new Error('Invalid language selection');
        }
        let newItems = await fetchAlmanaxData(newLevel, inputLanguage);
        newItems = applyXPBoost(newItems);  // Apply XP boost after fetching
        onLevelUpdate(newItems, newLevel);
    };
    
    const updateLanguage = async (newLanguage: "en" | "fr" | "es" | "de") => {
        const validLanguages = ["en", "fr", "es", "de"] as const;
        if (!validLanguages.includes(newLanguage)) {
            throw new Error("Invalid language");
        }
        
        // Update Paraglide language
        setLanguageTag(newLanguage);
        inputLanguage = newLanguage;
        
        // Update preferences and localStorage
        updatePreferences({ level: userLevel, language: newLanguage, isAccountProtected });
        
        // Fetch new data with updated language and apply XP boost
        let newItems = await fetchAlmanaxData(userLevel, newLanguage);
        newItems = applyXPBoost(newItems);  // Apply XP boost after fetching
        onLevelUpdate(newItems, userLevel);
    };
    
    onMount(async () => {
        if (browser) {
            // Set default level to 150 if no stored level exists
            const storedLevel = localStorage.getItem('level');
            if (storedLevel) {
                userLevel = parseInt(storedLevel);
                inputLevel = parseInt(storedLevel);
            } else {
                userLevel = 150;
                inputLevel = 150;
                localStorage.setItem('level', '150');
            }
            
            // Handle language initialization
            const storedLanguage = localStorage.getItem('selectedLanguage');
            const currentLanguage = languageTag();
            
            // Determine which language to use
            let targetLanguage: "en" | "fr" | "es" | "de";
            if (storedLanguage === 'en' || storedLanguage === 'fr' || storedLanguage === 'es' || storedLanguage === 'de') {
                targetLanguage = storedLanguage;
            } else if (currentLanguage === 'en' || currentLanguage === 'fr' || currentLanguage === 'es' || currentLanguage === 'de') {
                targetLanguage = currentLanguage;
            } else {
                targetLanguage = 'fr';
            }
            
            // Set initial language and update UI
            setLanguageTag(targetLanguage);
            inputLanguage = targetLanguage;
            
            // Initialize isAccountProtected from localStorage
            const storedIsAccountProtected = localStorage.getItem('isAccountProtected');
            if (storedIsAccountProtected) {
                isAccountProtected = storedIsAccountProtected === 'true';
            }
            
            updatePreferences({ level: userLevel, language: targetLanguage, isAccountProtected });
            
            // Fetch initial data and apply XP boost
            let newItems = await fetchAlmanaxData(userLevel, targetLanguage);
            newItems = applyXPBoost(newItems);  // Apply XP boost after fetching
            onLevelUpdate(newItems, userLevel);
        }
    });
    </script>

<div>
    <!-- svelte-ignore event_directive_deprecated -->
    <button on:click={() => showModal = true} class="settings-button">
        <img src="/settings.svg" alt="Settings" class="w-6 h-6 settings-icon">
    </button>

    {#if showModal}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore event_directive_deprecated -->
        <div class="modal z-[1500]" transition:fade={{ duration: 200 }} on:click={() => showModal = false}>
            <div class="modal-content flex flex-col items-center" on:click|stopPropagation>
                <h2 class="text-2xl font-semibold text-center pb-2 text-[#ffffe6]">{settings()}</h2>
                <div class="flex gap-2">
                    <label for="level" class="text-[#ffffe6]">{level()}:</label>
                    <input type="number" id="level" min="1" max="200" bind:value={inputLevel} class="w-[50px] text-black rounded-md" />    
                </div>
                <div class="flex gap-2 pt-2">
                    <label for="language" class="text-[#ffffe6]">{language()}:</label>
                    <select id="language" bind:value={inputLanguage} class="w-[100px] text-black rounded-md">
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>
                <div class="flex gap-2 pt-2">
                    <label for="isAccountProtected" class="text-[#ffffe6]">{protected_account()}:</label>
                    <input type="checkbox" id="isAccountProtected" bind:checked={isAccountProtected} class="w-[20px] h-[20px] text-black rounded-md" />
                </div>
                <div class="flex gap-2">
                    <button on:click={() => { updateLevel(inputLevel); updateLanguage(inputLanguage); showModal = false; }} class="mt-2 bg-white p-1 text-black rounded-md">Update</button>
                    <button on:click={() => showModal = false} class="mt-2 bg-red-500 p-1 text-white rounded-md">Close</button>
                </div>
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
    .settings-icon {
        transition: transform 0.5s ease-in-out;
        transform:rotate(0deg)
    }
    .settings-icon:hover {
        transition: transform 0.5s ease-in-out;
        transform:rotate(360deg)
    }
</style>