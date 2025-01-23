<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { browser } from '$app/environment';
    import { level, settings, language, protected_account, close } from '$lib/paraglide/messages';
    import { setLanguageTag, languageTag } from '$lib/paraglide/runtime';
    import { preferences } from '$lib/stores/almanaxStore';
    import { fetchAlmanaxData } from '$lib/api/almanax';
    import type { AlmanaxState } from '$lib/types/AlmanaxState';
    import type { Preferences } from '$lib/types/Preferences';

    type Language = "en" | "fr" | "es" | "de";

    let { onLevelUpdate, initialLevel = 150, initialLanguage = 'fr', isAccountProtected: initialProtected = true } = $props<{ 
        items: AlmanaxState[], 
        onLevelUpdate: (items: AlmanaxState[], level: number) => void,
        initialLevel: number,
        initialLanguage?: Language,
        isAccountProtected?: boolean
    }>();

    let userLevel = $state(initialLevel);
    let inputLevel = $state(initialLevel);
    let showModal = $state(false);
    let inputLanguage = $state<Language>(initialLanguage);
    let isAccountProtected = $state(initialProtected);

    const VALID_LANGUAGES: Language[] = ["en", "fr", "es", "de"];

    const validateAndSetLanguage = (lang: string): Language => {
        if (VALID_LANGUAGES.includes(lang as Language)) {
            return lang as Language;
        }
        return 'fr';
    };

    const formatLanguage = (lang: Language): string => {
        switch (lang) {
            case 'en':
                return 'English';
            case 'fr':
                return 'Français';
            case 'es':
                return 'Español';
            case 'de':
                return 'Deutsch';
            default:
                return 'Français';
        }
    };

    const savePreferences = (prefs: Preferences) => {
        localStorage.setItem('level', prefs.level.toString());
        localStorage.setItem('selectedLanguage', prefs.language);
        localStorage.setItem('isAccountProtected', prefs.isAccountProtected.toString());
    };

    let previousPreferences = $state<Preferences>({
        level: initialLevel,
        language: initialLanguage,
        isAccountProtected: initialProtected,
    });

    const updatePreferences = async (updates: Partial<Preferences>) => {
        const newPreferences = { level: userLevel, language: inputLanguage, isAccountProtected, ...updates };
        savePreferences(newPreferences);
        preferences.set(newPreferences);

        const newItems = await fetchAlmanaxData(newPreferences.level, newPreferences.language);
        const boostedItems = applyXPBoost(newItems);
        onLevelUpdate(boostedItems, newPreferences.level);

        // Send only the changed values to Umami
        if (browser && typeof window.umami !== 'undefined') {
            const changedValues: Partial<Preferences> = {};

            if (newPreferences.level !== previousPreferences.level) {
                changedValues.level = newPreferences.level;
            }
            if (newPreferences.language !== previousPreferences.language) {
                changedValues.language = newPreferences.language;
            }
            if (newPreferences.isAccountProtected !== previousPreferences.isAccountProtected) {
                changedValues.isAccountProtected = newPreferences.isAccountProtected;
            }

            if (Object.keys(changedValues).length > 0) {
                window.umami.track('update-preferences', changedValues);
            }

            // Update previousPreferences to the new values
            previousPreferences = { ...newPreferences };
        }
    };


    const applyXPBoost = (items: AlmanaxState[]): AlmanaxState[] => {
        return items.map(item => ({
            ...item,
            reward_xp: isAccountProtected ? Math.round(item.reward_xp * 1.05) : item.reward_xp
        }));
    };

    const updateLevel = async (newLevel: number) => {
        userLevel = newLevel;
        inputLevel = newLevel;
        await updatePreferences({ level: newLevel });
    };

    const updateLanguage = async (newLanguage: Language) => {
        setLanguageTag(newLanguage);
        inputLanguage = newLanguage;
        await updatePreferences({ language: newLanguage });
    };

    const updateProtectedStatus = async (protectedStatus: boolean) => {
        isAccountProtected = protectedStatus;
        await updatePreferences({ isAccountProtected: protectedStatus });
    };

    $effect(() => {
        if (showModal) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    });

    onMount(async () => {
        if (browser) {
            const storedLevel = parseInt(localStorage.getItem('level') || '150');
            const storedLanguage = validateAndSetLanguage(localStorage.getItem('selectedLanguage') || languageTag() || 'fr');
            const storedIsAccountProtected = localStorage.getItem('isAccountProtected') !== null ? localStorage.getItem('isAccountProtected') === 'true' : true;
            userLevel = storedLevel;
            inputLevel = storedLevel;
            inputLanguage = storedLanguage;
            isAccountProtected = storedIsAccountProtected;

            setLanguageTag(storedLanguage);
            await updatePreferences({ level: storedLevel, language: storedLanguage, isAccountProtected: storedIsAccountProtected });
        }
    });
</script>


<div>
    <!-- svelte-ignore event_directive_deprecated -->
    <button on:click={() => showModal = true} class="settings-button">
        <img src="/settings.svg" alt="Settings" class="w-6 h-6 settings-icon transition-transform duration-500 ease-in-out hover:rotate-360 md:mt-0">
    </button>

    {#if showModal}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore event_directive_deprecated -->
        <div 
        class="fixed inset-0 z-[1500] bg-black/50 py-5 overflow-y-auto flex items-center justify-center"
        transition:fade={{ duration: 200 }} 
        on:click|stopPropagation
        >
        <div 
            class="modal-content flex flex-col items-center bg-[#1e1e1e] rounded-lg p-6 w-[80vw] max-h-[90vh] md:w-[30vw] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            on:click|stopPropagation
            >
                <h2 class="text-2xl font-semibold text-center pb-4 text-white">{settings()}</h2>
                <div class="w-full max-w-xs space-y-4">
                    <div class="flex flex-col gap-2">
                        <label for="level" class="text-white text-center">{level()}:</label>
                        <input 
                            type="number" 
                            id="level" 
                            min="1" 
                            max="200" 
                            bind:value={inputLevel} 
                            class="w-full p-2 text-black rounded-md text-center [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none" 
                        />    
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="language" class="text-white text-center">{language()}:</label>
                        <select 
                            id="language" 
                            bind:value={inputLanguage} 
                            class="w-full p-2 text-black rounded-md text-center pl-[1.15rem]"
                        >
                            {#each VALID_LANGUAGES as lang}
                                <option value={lang}>{formatLanguage(lang)}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="flex items-center justify-center gap-2">
                        <label for="isAccountProtected" class="text-white">{protected_account()}</label>
                        <input 
                            type="checkbox" 
                            id="isAccountProtected" 
                            bind:checked={isAccountProtected} 
                            on:change={() => updateProtectedStatus(isAccountProtected)}
                            class="w-5 h-5 text-black rounded-md" 
                        />
                    </div>
                </div>
                <div class="flex gap-4 mt-6">
                    <button 
                        on:click={async () => { 
                            await updateLevel(inputLevel); 
                            await updateLanguage(inputLanguage); 
                            showModal = false; 
                        }} 
                        class="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-100 transition-colors"
                    >
                        OK
                    </button>
                    <button 
                        on:click={() => showModal = false} 
                        class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                        {close()}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(.no-scroll) {
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
    }
</style>