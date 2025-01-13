<script lang="ts">
    import { fly } from 'svelte/transition';
    import { clipboard } from '$lib/paraglide/messages';
    </script>
    
    <div
      class="fixed left-1/2 bottom-4 z-[1000] -translate-x-1/2 transform rounded-lg bg-[#10100e] px-4 py-2 text-[#ffffe6] font-semibold whitespace-nowrap text-sm"
      in:fly={{ y: 20, duration: 300 }}
      out:fly={{ y: 20, duration: 200 }}
    >
      {clipboard()}
    </div>