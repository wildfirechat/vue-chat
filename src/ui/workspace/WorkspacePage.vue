<template>
    <section>
        <h1>dummy page, on available on pc</h1>
    </section>
</template>

<script>

// dummy page
export default {
    name: "WorkspacePage",
}
</script>

<style scoped>
.workspace-container {
    width: 100%;
    height: 100%;
}

.workspace-portal {
    position: absolute;
    left: 0;
    top: 32px;
    width: 100%;
    height: calc(100% - 32px);
    display: flex;
    flex-direction: column;
}

.workspace-portal button {
    padding: 10px;
    margin: 20px;
    border-radius: 3px;
}

>>> .etabs-tab {
    height: 32px;
}

</style>
