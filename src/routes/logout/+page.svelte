<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user, token } from '../../lib/stores';

    onMount(() => {
        $token = null;
        $user = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        goto('/');
    });
</script>