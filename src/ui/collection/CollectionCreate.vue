<template>
    <div class="collection-create">
        <!-- Header -->
        <header v-if="!isElectron" class="page-header">
            <div class="header-left">
                <span class="back-btn" @click="closeWindow">{{ $t('common.back') }}</span>
            </div>
            <div class="header-title">{{ $t('collection.create_collection') }}</div>
            <div class="header-right"></div>
        </header>

        <!-- Create Form -->
        <div class="create-content">
            <div class="form-wrapper">
                <h2 class="page-title">{{ $t('collection.create_collection') }}</h2>
                <div class="form-item">
                    <label class="form-label">{{ $t('collection.collection_title') }}</label>
                    <input v-model="form.title" type="text" :placeholder="$t('collection.collection_title_hint')" class="input-field" autofocus />
                </div>
                <div class="form-item">
                    <label class="form-label">{{ $t('collection.collection_desc') }}</label>
                    <textarea v-model="form.desc" :placeholder="$t('collection.collection_desc_hint')" rows="4" class="input-field textarea-field"></textarea>
                </div>
                <div class="form-item">
                    <label class="form-label">{{ $t('collection.collection_template') }}</label>
                    <input v-model="form.template" type="text" :placeholder="$t('collection.collection_template_hint')" class="input-field" />
                </div>
                <div class="form-item">
                    <label class="form-label">{{ $t('collection.collection_expire_type') }}</label>
                    <div class="radio-group">
                        <label class="radio-card" :class="{active: form.expireType === 0}">
                            <input type="radio" v-model="form.expireType" :value="0" />
                            <span class="radio-label">{{ $t('collection.collection_no_expire') }}</span>
                        </label>
                        <label class="radio-card" :class="{active: form.expireType === 1}">
                            <input type="radio" v-model="form.expireType" :value="1" />
                            <span class="radio-label">{{ $t('collection.collection_set_expire') }}</span>
                        </label>
                    </div>
                </div>
                <transition name="fade">
                    <div class="form-item" v-if="form.expireType === 1">
                        <label class="form-label">{{ $t('collection.collection_expire_time') }}</label>
                        <input type="datetime-local" v-model="form.expireAtStr" class="input-field datetime-input" :min="minDateStr" />
                    </div>
                </transition>
            </div>
        </div>

        <!-- Floating Footer Button -->
        <div class="floating-footer">
            <button class="action-btn" :disabled="!form.title" @click="createCollection">
                {{ $t('common.send') }}
            </button>
        </div>
    </div>
</template>

<script>
import collectionApi from "../../api/collectionApi";
import store from "../../store";

export default {
    name: "CollectionCreate",
    data() {
        return {
            groupId: '',
            form: {
                title: '',
                desc: '',
                template: '',
                expireType: 0,
                expireAtStr: '',
            },
            sharedMiscState: store.state.misc,
        };
    },
    computed: {
        isElectron() {
            return this.sharedMiscState.isElectron;
        },
        minDateStr() {
            let now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        }
    },
    mounted() {
        document.title = this.$t('collection.create_collection');
        
        // Initialize expire time to tomorrow
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
        this.form.expireAtStr = tomorrow.toISOString().slice(0, 16);
        
        this.groupId = this.$route.query.groupId || '';
    },
    methods: {
        async createCollection() {
            if (!this.form.title) return;
            this.loading = true;
            try {
                let expireAt = 0;
                if (this.form.expireType === 1 && this.form.expireAtStr) {
                    expireAt = new Date(this.form.expireAtStr).getTime();
                }

                await collectionApi.createCollection(
                    this.groupId,
                    this.form.title,
                    this.form.desc,
                    this.form.template,
                    this.form.expireType,
                    expireAt,
                    0
                );

                this.closeWindow();
            } catch (e) {
                alert(this.$t('collection.collection_create_failed') + ': ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        closeWindow() {
            window.close();
        }
    }
}
</script>

<style scoped>
.collection-create {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    background-color: #f5f6f7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #333;
    user-select: none;
}

/* Header */
.page-header {
    height: 50px;
    width: 100%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid #e6e6e6;
    -webkit-app-region: drag;
    flex-shrink: 0;
    z-index: 10;
}
.header-left, .header-right {
    width: 80px;
    -webkit-app-region: no-drag;
}
.header-right {
    text-align: right;
}
.header-title {
    font-weight: 600;
    font-size: 16px;
    color: #333;
}
.back-btn {
    cursor: pointer;
    font-size: 14px;
    color: #666;
    padding: 5px 0;
}
.back-btn:hover {
    color: #333;
}

/* Create Form */
.create-content {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    padding: 20px;
    padding-bottom: 80px;
    background: #fff;
}
.form-wrapper {
    width: 100%;
}
.page-title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 24px;
    color: #333;
}

.form-item {
    margin-bottom: 24px;
}
.form-label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-size: 14px;
    font-weight: 600;
}
.input-field {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    font-size: 15px;
    color: #333;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.datetime-input {
    margin-bottom: 40px;
}
.input-field:focus {
    border-color: #1f64e4;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
.textarea-field {
    resize: none;
    line-height: 1.5;
}

/* Radio Cards */
.radio-group {
    display: flex;
    gap: 15px;
}
.radio-card {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    background: #fff;
}
.radio-card:hover {
    background: #f9f9f9;
}
.radio-card.active {
    border-color: #1f64e4;
    background: #f0f7ff;
    color: #1f64e4;
}
.radio-card input {
    display: none;
}
.radio-label {
    font-size: 14px;
    font-weight: 500;
}

/* Floating Footer */
.floating-footer {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
}
.action-btn {
    pointer-events: auto;
    background: #1f64e4;
    color: white;
    border: none;
    padding: 12px 60px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    transition: transform 0.1s, box-shadow 0.2s, background 0.2s;
}
.action-btn:hover {
    background: #006ce6;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
}
.action-btn:active {
    transform: translateY(1px);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}
.action-btn:disabled {
    background: #b4d8ff;
    box-shadow: none;
    cursor: default;
    transform: none;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}
</style>
