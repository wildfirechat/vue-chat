<template>
    <div class="conversation-info">
        <div class="scroll-container">
            <!-- 搜索框 -->
            <div class="search-item">
                <input type="text" v-model="filterQuery" :placeholder="$t('common.search')">
                <i class="icon-ion-ios-search"></i>
            </div>

            <!-- 群成员 Grid -->
            <div class="member-section">
                <div class="member-grid">
                    <tippy
                        v-for="user in displayedMembers"
                        :key="user.uid"
                        :ref="'memberTippy-' + user.uid.replace('@', '#')"
                        theme="light"
                        :animate-fill="false"
                        animation="fade"
                        interactive
                        :trigger="clickGroupMemberItemFunc ? 'manual' : 'click'"
                        placement="left-start"
                    >
                        <div
                            class="member-grid-item"
                            @click="onClickMember(user)"
                        >
                            <img :src="user.portrait" @error="onImgError($event)" class="member-avatar"/>
                            <p class="member-name">{{ user._displayName || user.displayName }}</p>
                        </div>
                        <template #content>
                            <UserCardView :user-info="user" v-on:close="closeUserCard(user)"/>
                        </template>
                    </tippy>
                    <!-- 添加按钮 -->
                    <div v-if="enableAddGroupMember && !filterQuery" class="member-grid-item action-grid-item" @click="showCreateConversationModal">
                        <div class="action-icon add-icon">+</div>
                        <p class="member-name">{{ $t('conversation.add_member') }}</p>
                    </div>
                    <!-- 删除按钮 -->
                    <div v-if="enableRemoveGroupMember && !filterQuery" class="member-grid-item action-grid-item" @click="showRemoveGroupMemberModal">
                        <div class="action-icon remove-icon">-</div>
                        <p class="member-name">{{ $t('conversation.remove_member') }}</p>
                    </div>
                </div>
                <!-- 查看更多 -->
                <div v-if="!showAllMembers && hasMoreMembers" class="show-more-btn" @click="showAllMembers = true">
                    查看全部群成员 ({{ users.length }}) &gt;
                </div>
            </div>

            <!-- 分隔线 -->
            <div class="section-divider"></div>

            <!-- 群信息 -->
            <header>
                <div class="group-portrait-container">
                    <p>群头像</p>
                    <img :src="conversationInfo.conversation._target.portrait" @click="pickFile"/>
                    <input v-if="enableModifyGroupNameAndPortrait" ref="fileInput" @change="onPickFile($event)" class="icon-ion-android-attach" type="file"
                           accept="image/png, image/jpeg"
                           style="display: none">
                </div>
                <label>
                    {{ $t('conversation.group_name') }}
                    <input type="text"
                           ref="groupNameInput"
                           :disabled="!enableModifyGroupNameAndPortrait"
                           v-model="newGroupName"
                           @keyup.enter="updateGroupName"
                           :placeholder="conversationInfo.conversation._target._displayName">
                </label>
                <label>
                    {{ $t('conversation.group_announcement') }}
                    <input type="text"
                           ref="groupAnnouncementInput"
                           :disabled="!enableModifyAnnouncement"
                           @keyup.enter='updateGroupAnnouncement'
                           v-model.trim="newGroupAnnouncement"
                           :placeholder="groupAnnouncement">
                </label>
                <label>
                    {{ $t('group.alias') }}
                    <input type="text"
                           @keyup.enter='updateGroupAlias'
                           v-model.trim="newGroupAlias"
                           :placeholder="groupAlias">
                </label>
                <label class="switch">
                    <span>保存到通讯录</span>
                    <input type="checkbox"
                           :checked="conversationInfo.conversation._target._isFav"
                           @change="setFavGroup(conversationInfo.conversation.target, $event.target.checked)">
                </label>
            </header>

            <!-- 操作按钮 -->
            <div v-if="sharedMiscState.isElectron" @click="clearConversationHistory" class="conversation-action-item">
                {{ $t('conversation.clear_conversation_history') }}
            </div>
            <div class="conversation-action-item" @click="clearRemoteConversationHistory">
                {{ $t('conversation.clear_remote_conversation_history') }}
            </div>
            <div class="conversation-action-item" @click="complain">
                {{ $t('conversation.complain') }}
            </div>
            <div v-if="enableQuitGroup" @click="quitGroup" class="conversation-action-item">
                {{ $t('conversation.quit_group') }}
            </div>
            <div v-if="enableDismissGroup" @click="dismissGroup" class="conversation-action-item">
                {{ $t('conversation.dismiss_group') }}
            </div>
        </div>
    </div>
</template>

<script>
import UserCardView from "../user/UserCardView.vue";
import ConversationInfo from "../../../wfc/model/conversationInfo";
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";
import GroupMemberType from "../../../wfc/model/groupMemberType";
import GroupType from "../../../wfc/model/groupType";
import ModifyGroupInfoType from "../../../wfc/model/modifyGroupInfoType";
import EventType from "../../../wfc/client/wfcEvent";
import appServerApi from "../../../api/appServerApi";
import MessageContentMediaType from "../../../wfc/messages/messageContentMediaType";
import MessageContentType from "../../../wfc/messages/messageContentType";
import {isElectron} from "../../../platform";
import {showComplainAlert} from "./conversationComplainHelper";

export default {
    name: "GroupConversationInfoView",
    inject: {
        conversationActiveStore: {
            default: null,
        },
    },
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
        }
    },
    data() {
        const activeStore = this.conversationActiveStore || store;
        return {
            activeStore: activeStore,
            groupMemberUserInfos: [],
            filterQuery: '',
            sharedContactState: activeStore.state.contact,
            sharedMiscState: activeStore.state.misc,
            groupAnnouncement: '',
            newGroupName: '',
            newGroupAnnouncement: '',
            newGroupAlias: '',
            groupAlias: '',
            showAllMembers: false,
        }
    },

    mounted() {
        wfc.eventEmitter.on(EventType.UserInfosUpdate, this.onUserInfosUpdate);
        wfc.eventEmitter.on(EventType.GroupMembersUpdate, this.onUserInfosUpdate)
        wfc.eventEmitter.on(EventType.ReceiveMessage, this.onReceiveMessage)
        wfc.getGroupMembers(this.conversationInfo.conversation.target, true);

        let userInfo = wfc.getUserInfo(wfc.getUserId(), false, this.conversationInfo.conversation.target);
        this.groupAlias = userInfo.groupAlias ? userInfo.groupAlias : userInfo.displayName;

        this.loadGroupMemberUserInfos();
    },

    beforeUnmount() {
        wfc.eventEmitter.removeListener(EventType.UserInfosUpdate, this.onUserInfosUpdate);
        wfc.eventEmitter.removeListener(EventType.GroupMembersUpdate, this.onUserInfosUpdate);
        wfc.eventEmitter.removeListener(EventType.ReceiveMessage, this.onReceiveMessage);
    },

    components: {UserCardView},
    methods: {
        onReceiveMessage(msg, hasMore) {
            if (msg.conversation.equal(this.conversationInfo.conversation) && msg.messageContent.type === MessageContentType.RejectJoinGroup) {
                let content = msg.messageContent;
                if (content.operator === wfc.getUserId()) {
                    this.$notify({
                        text: content.formatNotification(msg),
                        type: 'warn'
                    });
                }
            }
        },
        onUserInfosUpdate() {
            this.groupMemberUserInfos = this.activeStore.getConversationMemberUsrInfos(this.conversationInfo.conversation);
        },
        showCreateConversationModal() {
            let successCB = users => {
                let ids = users.map(u => u.uid);
                wfc.addGroupMembers(this.conversationInfo.conversation.target, ids, null, [0])
            }
            let groupMemberUserInfos = this.activeStore.getGroupMemberUserInfos(this.conversationInfo.conversation.target, false);

            this.$pickContact({
                successCB,
                initialCheckedUsers: groupMemberUserInfos,
                uncheckableUsers: groupMemberUserInfos,
                confirmTitle: this.$t('common.add'),
                showOrganization: true
            });
        },

        showRemoveGroupMemberModal() {
            let successCB = users => {
                let ids = users.map(u => u.uid);
                wfc.kickoffGroupMembers(this.conversationInfo.conversation.target, ids, [0])
            }
            let groupMemberUserInfos = this.activeStore.getGroupMemberUserInfos(this.conversationInfo.conversation.target, false, false);
            this.$pickContact({
                successCB,
                users: groupMemberUserInfos,
            });
        },

        showUserInfo(user) {
            console.log('todo show userInfo', user);
        },

        async getGroupAnnouncement() {
            appServerApi.getGroupAnnouncement(this.conversationInfo.conversation.target)
                .then(response => {
                    if (response.text) {
                        this.groupAnnouncement = response.text;
                    }
                })
                .catch(err => {
                    console.log('getGroupAnnouncement', err)
                    if (this.enableModifyAnnouncement) {
                        this.groupAnnouncement = this.$t('conversation.click_to_edit_group_announcement');
                    }
                })
        },

        updateGroupName() {
            let groupId = this.conversationInfo.conversation.target;
            if (!this.newGroupName || this.newGroupName === this.conversationInfo.conversation._target._displayName) {
                return;
            }

            wfc.modifyGroupInfo(groupId, ModifyGroupInfoType.Modify_Group_Name, this.newGroupName, [0], null, () => {
                this.conversationInfo.conversation._target._displayName = this.newGroupName;
                this.$refs.groupNameInput.blur();
            }, (err) => {
                // do nothing
            })
        },

        async updateGroupAnnouncement() {
            if (!this.newGroupAnnouncement || this.newGroupAnnouncement === this.groupAnnouncement) {
                return;
            }
            await appServerApi.updateGroupAnnouncement(wfc.getUserId(), this.conversationInfo.conversation.target, this.newGroupAnnouncement)
            this.groupAnnouncement = this.newGroupAnnouncement;
            this.$refs.groupAnnouncementInput.blur();
        },

        updateGroupAlias() {
            if (this.newGroupAlias && this.newGroupAlias !== this.groupAlias) {
                wfc.modifyGroupAlias(this.conversationInfo.conversation.target, this.newGroupAlias, [0], null, () => {
                    this.groupAlias = this.newGroupAlias;
                }, null);
            }
        },

        quitGroup() {
            this.$alert({
                title: '退出群组',
                content: '确定退出群组？',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.activeStore.quitGroup(this.conversationInfo.conversation.target)
                }
            })
        },

        dismissGroup() {
            this.$alert({
                title: '解散群组',
                content: '确定解散群组？',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.activeStore.dismissGroup(this.conversationInfo.conversation.target)
                }
            })
        },

        complain() {
            showComplainAlert(this, this.activeStore);
        },

        setFavGroup(groupId, fav) {
            wfc.setFavGroup(groupId, fav, () => {
                this.conversationInfo.conversation._target._isFav = fav;
                this.activeStore.reloadFavGroupList();
            }, (err) => {
                console.log('setFavGroup error', err);
            })
        },

        pickFile() {
            if (!this.enableModifyGroupNameAndPortrait) {
                this.$notify({
                    text: '群主或管理员，才能更新头像',
                    type: 'warn'
                });
                return;
            }
            this.$refs['fileInput'].click();
        },

        onPickFile(event) {
            let file = event.target.files[0];
            wfc.uploadMedia(file.name, file, MessageContentMediaType.Portrait, (url) => {
                wfc.modifyGroupInfo(this.conversationInfo.conversation.target, ModifyGroupInfoType.Modify_Group_Portrait, url, [], null, () => {
                    console.log('modify group portrait success', url);
                }, (err) => {
                    console.log('err', err)
                })
            }, err => {
                console.log('update media error', err);
            }, (p, t) => {

            });
        },

        clearConversationHistory() {
            this.$alert({
                title: '清空本地聊天记录',
                content: '确定清空本地聊天记录？',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.$parent.enableLoadRemoteHistoryMessage = !this.sharedMiscState.isElectron;
                    this.activeStore.clearConversationHistory(this.conversationInfo.conversation)
                }
            })
        },

        clearRemoteConversationHistory() {
            this.$alert({
                title: '清空远程聊天记录',
                content: '确定清空远程聊天记录？',
                confirmText: '确定',
                confirmButtonType: 'danger',
                cancelText: '取消',
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.activeStore.clearRemoteConversationHistory(this.conversationInfo.conversation);
                }
            })
        },

        closeUserCard(user) {
            const ref = this.$refs['memberTippy-' + user.uid.replace('@', '#')];
            const inst = Array.isArray(ref) ? ref[0] : ref;
            if (inst && inst.$el && inst.$el._tippy) inst.$el._tippy.hide();
        },

        onClickMember(user) {
            const fn = this.clickGroupMemberItemFunc;
            if (fn) fn(user);
            // else: tippy is triggered by the click directly
        },

        onImgError(e) {
            const Config = require('../../../config').default;
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },

        async loadGroupMemberUserInfos() {
            let groupId = this.conversationInfo.conversation.target;
            if (isElectron()) {
                let memberIds = wfc.getGroupMemberIds(groupId, true);
                const step = 500;
                for (let i = 0; i < memberIds.length;) {
                    let ids = memberIds.slice(i, i + step)
                    i += step;
                    let userInfos = await this.activeStore.getPartialGroupMembersInfoAsync(groupId, ids)
                    this.groupMemberUserInfos.push(...userInfos);
                }
            } else {
                this.groupMemberUserInfos = this.activeStore.getGroupMemberUserInfos(groupId);
            }
        }
    },

    created() {
        this.getGroupAnnouncement();
    },

    computed: {
        enableQuitGroup() {
            let groupInfo = this.conversationInfo.conversation._target;
            if (groupInfo.type === GroupType.Organization) {
                return false;
            }
            return true;
        },

        clickGroupMemberItemFunc() {
            console.log('clickGroupMemberItemFunc');
            let groupInfo = this.conversationInfo.conversation._target;
            let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, wfc.getUserId());
            if (groupInfo.privateChat === 1 && [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) === -1) {
                return () => {
                    // 群里面，禁止发起私聊
                    this.$notify({
                        text: '禁止发起私聊'
                    })
                };
            }
            return null;
        },

        enableDismissGroup() {
            let groupInfo = this.conversationInfo.conversation._target;
            if (groupInfo.type === GroupType.Organization) {
                return false;
            }
            if (groupInfo.owner === wfc.getUserId()) {
                return true;
            }
            return false;
        },

        enableAddGroupMember() {
            let selfUid = wfc.getUserId();
            let groupInfo = this.conversationInfo.conversation._target;
            if (groupInfo.type === GroupType.Organization) {
                return false;
            }
            //在group type为Restricted时，0 开放加入权限（群成员可以拉人，用户也可以主动加入）；1 只能群成员拉人入群；2 只能群管理拉人入群
            if (groupInfo.type === GroupType.Restricted) {
                if (groupInfo.joinType === 0 || groupInfo.joinType === 1) {
                    return true;
                } else if (groupInfo.joinType === 2) {
                    let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, selfUid);
                    return [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
                }
            }
            return true;
        },

        enableRemoveGroupMember() {
            let groupInfo = this.conversationInfo.conversation._target;
            if (groupInfo.type === GroupType.Organization) {
                return false;
            }
            let selfUid = wfc.getUserId();
            let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, selfUid);
            if (groupMember) {
                return [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
            }
            return false;

        },

        enableModifyGroupNameAndPortrait() {
            let groupInfo = this.conversationInfo.conversation._target;
            if (groupInfo.type === GroupType.Organization) {
                return false;
            } else if (groupInfo.type === GroupType.Restricted) {
                let selfUid = wfc.getUserId();
                let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, selfUid);
                if (groupMember) {
                    return [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        },

        enableModifyAnnouncement() {
            let selfUid = wfc.getUserId();
            let groupMember = wfc.getGroupMember(this.conversationInfo.conversation.target, selfUid);
            if (groupMember) {
                return [GroupMemberType.Manager, GroupMemberType.Owner].indexOf(groupMember.type) >= 0;
            }
            return false;
        },

        users() {
            if (this.filterQuery) {
                return this.activeStore.filterUsers(this.groupMemberUserInfos, this.filterQuery)
            } else {
                return this.groupMemberUserInfos;
            }
        },

        // 每行4个，预留最后2个位置给添加/删除按钮，最多4行=16个格子
        // 实际成员区域：格子总数16，减去操作按钮占位数
        maxRows() {
            return 4;
        },

        actionCount() {
            let count = 0;
            if (this.enableAddGroupMember && !this.filterQuery) count++;
            if (this.enableRemoveGroupMember && !this.filterQuery) count++;
            return count;
        },

        maxMembersInGrid() {
            // 4列 * 4行，减去操作按钮占位数
            return this.maxRows * 4 - this.actionCount;
        },

        hasMoreMembers() {
            return this.users.length > this.maxMembersInGrid;
        },

        displayedMembers() {
            if (this.filterQuery || this.showAllMembers) {
                return this.users;
            }
            return this.users.slice(0, this.maxMembersInGrid);
        },
    },
};
</script>

<style lang="css" scoped>
.conversation-info {
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;
    overflow: hidden;
}

.scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
}

/* 搜索框 */
.search-item {
    position: relative;
    padding: 10px 20px;
    flex-shrink: 0;
}

.search-item input {
    width: 100%;
    padding: 0 10px 0 20px;
    height: 25px;
    border-radius: 3px;
    border: 1px solid var(--border-tertiary);
    background-color: var(--background-primary);
    text-align: left;
    outline: none;
    box-sizing: border-box;
}

.search-item input:active,
.search-item input:focus {
    border: 1px solid var(--border-active);
}

.search-item i {
    position: absolute;
    left: 25px;
    top: 15px;
}

/* 群成员区域 */
.member-section {
    padding: 0 8px 8px;
    flex-shrink: 0;
}

.member-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 4px;
}

.member-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px;
    cursor: pointer;
    border-radius: 4px;
    min-width: 0;
    overflow: hidden;
}

/* no hover background for regular members */

/* action grid item hover: change icon color and border */
.action-grid-item:hover .action-icon {
    color: var(--accent-color);
    border-color: var(--accent-color);
}

.member-avatar {
    width: 44px;
    height: 44px;
    border-radius: 5px;
    object-fit: cover;
}

.member-name {
    margin-top: 4px;
    font-size: 11px;
    color: var(--text-secondary-strong);
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 添加/删除操作格子 */
.action-grid-item .action-icon {
    width: 44px;
    height: 44px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    border: 1px dashed var(--border-dashed);
    font-size: 22px;
    color: var(--text-secondary-strong);
}

.add-icon {
    color: var(--text-secondary-strong);
}

.remove-icon {
    color: var(--text-secondary-strong);
}

.show-more-btn {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary-strong);
    cursor: pointer;
    padding: 6px 0;
}

.show-more-btn:hover {
    color: var(--text-primary);
}

/* 分隔线 */
.section-divider {
    height: 1px;
    background-color: var(--border-tertiary);
    margin: 4px 0;
    flex-shrink: 0;
}

/* 群信息 header */
header {
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
}

header .group-portrait-container {
    display: flex;
    width: 100%;
    justify-content: flex-start;
    align-items: center;
}

header .group-portrait-container p {
    color: var(--text-primary);
    font-size: 13px;
}

header .group-portrait-container img {
    width: 30px;
    height: 30px;
    border-radius: 5px;
    margin-left: auto;
    cursor: pointer;
}

header label {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 13px;
    color: var(--text-primary);
}

header label:not(:first-of-type) {
    margin-top: 15px;
}

header label input {
    flex: 1;
    margin-top: 5px;
    border: none;
    outline: none;
    width: 100%;
    font-size: 13px;
    background-color: transparent;
}

header label input::-webkit-input-placeholder {
    color: var(--text-secondary-strong);
}

/* 操作项 */
.conversation-action-item {
    display: flex;
    color: var(--text-danger);
    align-items: center;
    justify-content: center;
    font-size: 12px;
    height: 42px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-tertiary);
    margin: 0 10px;
    cursor: pointer;
}

.conversation-action-item:active {
    background: var(--background-item-placeholder);
}

.switch {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-bottom: 15px;
    margin-top: 15px;
}

.switch input {
    margin: 0;
    flex: 0;
}
</style>
