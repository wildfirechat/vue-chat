<template>
    <div class="ai-container">
        <iframe
            :src="aiPortalUrl"
            class="ai-frame"
            frameborder="0"
            allow="microphone; camera"
        ></iframe>
    </div>
</template>

<script>
import Config from "../../config";

export default {
    name: 'AI',
    computed: {
        aiPortalUrl() {
            return Config.AI_PORTAL_URL
        }
    }
}
</script>

<style scoped>
.ai-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.ai-frame {
    width: 100%;
    height: 100%;
    border: none;
}
</style>
