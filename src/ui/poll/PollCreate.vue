<template>
    <div class="poll-create">
        <div class="create-content">
            <div class="form-wrapper">
                <div class="create-header">
                    <span class="back-btn" @click="goBack">‹ {{ $t('common.back') }}</span>
                    <span class="create-title">{{ $t('poll.create_poll') }}</span>
                    <span class="placeholder"></span>
                </div>

                <!-- 标题输入 -->
                <div class="form-item">
                    <label class="form-label">{{ $t('poll.poll_title') }}</label>
                    <input v-model="form.title" type="text" :placeholder="$t('poll.poll_title_hint')" class="input-field" autofocus />
                </div>

                <!-- 描述输入 -->
                <div class="form-item">
                    <label class="form-label">{{ $t('poll.poll_desc') }}</label>
                    <textarea v-model="form.desc" :placeholder="$t('poll.poll_desc_hint')" rows="3" class="input-field textarea-field"></textarea>
                </div>

                <!-- 选项列表 -->
                <div class="form-item">
                    <label class="form-label">{{ $t('poll.poll_options') }}</label>
                    <div class="options-list">
                        <div v-for="(option, index) in form.options" :key="index" class="option-item">
                            <input v-model="form.options[index]" type="text" :placeholder="$t('poll.option_hint', {index: index + 1})" class="input-field option-input" />
                            <button v-if="form.options.length > 2" class="delete-option-btn" @click="removeOption(index)">✕</button>
                        </div>
                    </div>
                    <button v-if="form.options.length < 10" class="add-option-btn" @click="addOption">
                        + {{ $t('poll.add_option') }}
                    </button>
                    <div class="option-hint">{{ $t('poll.options_hint') }}</div>
                </div>

                <!-- 投票设置 -->
                <div class="form-item">
                    <label class="form-label">{{ $t('poll.poll_settings') }}</label>
                    <div class="settings-list">
                        <!-- 投票类型 -->
                        <div class="setting-item" @click="showPollTypeDialog">
                            <span class="setting-label">{{ $t('poll.poll_type') }}</span>
                            <span class="setting-value">{{ pollTypeText }}</span>
                            <span class="setting-arrow">›</span>
                        </div>

                        <!-- 匿名投票 -->
                        <div class="setting-item">
                            <span class="setting-label">{{ $t('poll.anonymous_poll') }}</span>
                            <label class="switch">
                                <input type="checkbox" v-model="form.anonymous">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <!-- 始终显示结果 -->
                        <div class="setting-item">
                            <span class="setting-label">{{ $t('poll.show_result_always') }}</span>
                            <label class="switch">
                                <input type="checkbox" v-model="form.showResult">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <!-- 截止时间 -->
                        <div class="setting-item" @click="showEndTimePicker">
                            <span class="setting-label">{{ $t('poll.end_time') }}</span>
                            <span class="setting-value">{{ endTimeText }}</span>
                            <span class="setting-arrow">›</span>
                        </div>

                        <!-- 可见性 -->
                        <div class="setting-item" @click="showVisibilityDialog">
                            <span class="setting-label">{{ $t('poll.visibility') }}</span>
                            <span class="setting-value">{{ visibilityText }}</span>
                            <span class="setting-arrow">›</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 发布按钮 -->
        <div class="floating-footer">
            <button class="action-btn" :disabled="!canCreate" @click="createPoll">
                {{ $t('poll.publish_poll') }}
            </button>
        </div>

        <!-- Poll Type Dialog -->
        <div v-if="showPollTypeDialogFlag" class="dialog-overlay" @click="showPollTypeDialogFlag = false">
            <div class="dialog-content" @click.stop>
                <div class="dialog-title">{{ $t('poll.select_poll_type') }}</div>
                <div class="dialog-options">
                    <div class="dialog-option" :class="{active: form.type === 1}" @click="selectPollType(1)">
                        {{ $t('poll.single_choice') }}
                    </div>
                    <div class="dialog-option" :class="{active: form.type === 2}" @click="selectPollType(2)">
                        {{ $t('poll.multiple_choice') }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Visibility Dialog -->
        <div v-if="showVisibilityDialogFlag" class="dialog-overlay" @click="showVisibilityDialogFlag = false">
            <div class="dialog-content" @click.stop>
                <div class="dialog-title">{{ $t('poll.select_visibility') }}</div>
                <div class="dialog-options">
                    <div class="dialog-option" :class="{active: form.visibility === 1}" @click="selectVisibility(1)">
                        {{ $t('poll.group_only') }}
                    </div>
                    <div class="dialog-option" :class="{active: form.visibility === 2}" @click="selectVisibility(2)">
                        {{ $t('poll.public_poll') }}
                    </div>
                </div>
            </div>
        </div>

        <!-- End Time Dialog -->
        <div v-if="showEndTimeDialogFlag" class="dialog-overlay" @click="cancelEndTime">
            <div class="dialog-content" @click.stop>
                <div class="dialog-title">{{ $t('poll.select_end_time') }}</div>
                <div class="datetime-picker">
                    <input 
                        type="datetime-local" 
                        v-model="tempEndTime" 
                        class="datetime-input"
                        :min="minDateTime"
                    />
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn cancel" @click="cancelEndTime">{{ $t('common.cancel') }}</button>
                    <button class="dialog-btn confirm" @click="confirmEndTime">{{ $t('common.confirm') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import pollApi from "../../api/pollApi";

export default {
    name: "PollCreate",
    data() {
        return {
            groupId: '',
            form: {
                title: '',
                desc: '',
                options: ['', ''],
                type: 1,
                anonymous: false,
                showResult: false,
                visibility: 1,
                endTime: 0
            },
            showPollTypeDialogFlag: false,
            showVisibilityDialogFlag: false,
            showEndTimeDialogFlag: false,
            tempEndTime: ''
        };
    },
    computed: {
        canCreate() {
            if (!this.form.title.trim()) return false;
            const validOptions = this.form.options.filter(o => o.trim() !== '');
            return validOptions.length >= 2;
        },
        pollTypeText() {
            return this.form.type === 1 ? this.$t('poll.single_choice') : this.$t('poll.multiple_choice');
        },
        visibilityText() {
            return this.form.visibility === 1 ? this.$t('poll.group_only') : this.$t('poll.public_poll');
        },
        endTimeText() {
            if (this.form.endTime === 0) {
                return this.$t('poll.no_end_time');
            }
            const date = new Date(this.form.endTime);
            return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        },
        minDateTime() {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        }
    },
    mounted() {
        document.title = this.$t('poll.create_poll');
        this.groupId = this.$route.query.groupId || '';
    },
    methods: {
        goBack() {
            this.$router.back();
        },
        addOption() {
            if (this.form.options.length < 10) {
                this.form.options.push('');
            }
        },
        removeOption(index) {
            if (this.form.options.length > 2) {
                this.form.options.splice(index, 1);
            }
        },
        showPollTypeDialog() {
            this.showPollTypeDialogFlag = true;
        },
        selectPollType(type) {
            this.form.type = type;
            this.showPollTypeDialogFlag = false;
        },
        showVisibilityDialog() {
            this.showVisibilityDialogFlag = true;
        },
        selectVisibility(visibility) {
            this.form.visibility = visibility;
            this.showVisibilityDialogFlag = false;
        },
        showEndTimePicker() {
            const now = new Date();
            now.setDate(now.getDate() + 1);
            this.tempEndTime = now.toISOString().slice(0, 16);
            this.showEndTimeDialogFlag = true;
        },
        confirmEndTime() {
            if (this.tempEndTime) {
                const date = new Date(this.tempEndTime);
                if (date.getTime() > Date.now()) {
                    this.form.endTime = date.getTime();
                    this.showEndTimeDialogFlag = false;
                } else {
                    alert(this.$t('poll.end_time_must_be_future'));
                }
            } else {
                this.form.endTime = 0;
                this.showEndTimeDialogFlag = false;
            }
        },
        cancelEndTime() {
            this.showEndTimeDialogFlag = false;
        },
        async createPoll() {
            if (!this.canCreate) return;

            try {
                const validOptions = this.form.options.filter(o => o.trim() !== '');
                await pollApi.createPoll(
                    this.groupId,
                    this.form.title.trim(),
                    this.form.desc.trim(),
                    validOptions,
                    this.form.visibility,
                    this.form.type,
                    this.form.type === 2 ? validOptions.length : 1,
                    this.form.anonymous ? 1 : 0,
                    this.form.endTime,
                    this.form.showResult ? 1 : 0
                );

                if (this.form.visibility === 2) {
                    if (confirm(this.$t('poll.forward_public_poll_tip'))) {
                        alert(this.$t('poll.forward_not_implemented'));
                    }
                } else {
                    this.$notify({
                        text: this.$t('poll.poll_sent_to_group'),
                        type: 'success',
                    });
                }

                window.close();
            } catch (e) {
                alert(this.$t('poll.poll_create_failed') + ': ' + e.message);
            }
        }
    }
}
</script>

<style scoped>
.poll-create {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    height: 100vh;
    background-color: #f5f6f7;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: #333;
    user-select: none;
}

.create-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 80px;
    width: 100%;
    height: 100%;
}

.create-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}

.back-btn {
    font-size: 15px;
    color: #576b95;
    cursor: pointer;
}

.create-title {
    font-size: 18px;
    font-weight: 600;
}

.placeholder {
    width: 60px;
}

.form-wrapper {
    width: 100%;
    background: #fff;
    padding: 20px 24px;
}

.form-item {
    margin-bottom: 24px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    color: #666;
    font-size: 14px;
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

.input-field:focus {
    border-color: #1f64e4;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.textarea-field {
    resize: none;
    line-height: 1.5;
}

.options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.option-input {
    flex: 1;
}

.delete-option-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.delete-option-btn:hover {
    color: #ff3b30;
}

.add-option-btn {
    width: 100%;
    padding: 12px;
    margin-top: 8px;
    border: 1px dashed #ddd;
    border-radius: 6px;
    background: #fff;
    color: #1f64e4;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
}

.add-option-btn:hover {
    border-color: #1f64e4;
    background: #f0f7ff;
}

.option-hint {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
}

.settings-list {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e5e5e5;
}

.setting-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-label {
    flex: 1;
    font-size: 15px;
    color: #333;
}

.setting-value {
    font-size: 14px;
    color: #666;
}

.setting-arrow {
    font-size: 18px;
    color: #999;
    margin-left: 4px;
}

.switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 28px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 28px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #1f64e4;
}

input:checked + .slider:before {
    transform: translateX(20px);
}

.floating-footer {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    padding: 0 24px;
}

.action-btn {
    pointer-events: auto;
    background: #1f64e4;
    color: white;
    border: none;
    padding: 12px 40px;
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

.action-btn:disabled {
    background: #b4d8ff;
    box-shadow: none;
    cursor: default;
    transform: none;
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.dialog-content {
    background: #fff;
    border-radius: 12px;
    width: 80%;
    max-width: 300px;
    overflow: hidden;
}

.dialog-title {
    padding: 16px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
}

.dialog-options {
    display: flex;
    flex-direction: column;
}

.dialog-option {
    padding: 14px 16px;
    text-align: center;
    font-size: 15px;
    color: #333;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
}

.dialog-option:last-child {
    border-bottom: none;
}

.dialog-option:hover, .dialog-option.active {
    background: #f5f6f7;
    color: #1f64e4;
}

/* DateTime Picker Dialog */
.datetime-picker {
    padding: 20px;
}

.datetime-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 15px;
    color: #333;
    outline: none;
}

.datetime-input:focus {
    border-color: #1f64e4;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.dialog-actions {
    display: flex;
    border-top: 1px solid #f0f0f0;
}

.dialog-btn {
    flex: 1;
    padding: 14px;
    border: none;
    background: #fff;
    font-size: 15px;
    cursor: pointer;
}

.dialog-btn.cancel {
    color: #666;
    border-right: 1px solid #f0f0f0;
}

.dialog-btn.confirm {
    color: #1f64e4;
    font-weight: 600;
}

.dialog-btn:hover {
    background: #f5f6f7;
}
</style>
