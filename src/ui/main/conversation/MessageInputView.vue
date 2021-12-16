<template>
    <section class="message-input-container">
        <section class="input-action-container">
            <VEmojiPicker
                id="emoji"
                v-show="showEmojiDialog"
                labelSearch="Search"
                lang="pt-BR"
                v-click-outside="hideEmojiView"
                :customEmojis="emojis"
                :customCategories="emojiCategories"
                @select="onSelectEmoji"
            />
            <ul>
                <li><i id="showEmoji" @click="toggleEmojiView" class="icon-ion-ios-heart"></i></li>
                <li><i @click="pickFile" class="icon-ion-android-attach"></i>
                    <input ref="fileInput" @change="onPickFile($event)" class="icon-ion-android-attach" type="file"
                           style="display: none">
                </li>
                <li v-if="sharedMiscState.isElectron"><i id="screenShot" @click="screenShot"
                                                         class="icon-ion-scissors"></i></li>
                <li v-if="sharedMiscState.isElectron"><i id="messageHistory" @click="showMessageHistory"
                                                         class="icon-ion-android-chat"></i></li>
            </ul>
            <ul>
                <li><i @click="startAudioCall" class="icon-ion-ios-telephone"></i></li>
                <li><i @click="startVideoCall" class="icon-ion-ios-videocam"></i></li>
            </ul>
        </section>
        <div @keyup.enter="send($event)"
             ref="input" class="input"
             @paste="handlePaste"
             draggable="false"
             title="Enter发送，Ctrl+Enter换行"
             autofocus
             @contextmenu.prevent="$refs.menu.open($event)"
             onmouseover="this.setAttribute('org_title', this.title); this.title='';"
             onmouseout="this.title = this.getAttribute('org_title');"
             v-on:tribute-replaced="onTributeReplaced"
             contenteditable="true">
        </div>
        <vue-context ref="menu" :lazy="true">
            <li>
                <a @click.prevent="handlePaste($event, 'menu')">
                    {{ $t('common.paste') }}
                </a>
            </li>
            <li v-show="hasInputTextOrImage">
                <a @click.prevent="copy">
                    {{ $t('common.copy') }}
                </a>
            </li>
            <li>
                <a @click.prevent="cut">{{ $t('common.cut') }}</a>
            </li>
        </vue-context>
        <QuoteMessageView
            v-if="quotedMessage !== null"
            style="padding: 10px 20px"
            v-on:cancelQuoteMessage="cancelQuoteMessage"
            :enable-message-preview="false"
            :quoted-message="quotedMessage" :show-close-button="true"/>
    </section>
</template>

<script>
import wfc from "@/wfc/client/wfc";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import store from "@/store";
import {categoriesDefault, emojisDefault, VEmojiPicker} from "@imndx/v-emoji-picker"
import ClickOutside from "vue-click-outside";
import Tribute from "tributejs";
import '../../../tribute.css'
import ConversationType from "@/wfc/model/conversationType";
import ConversationInfo from "@/wfc/model/conversationInfo";
import GroupInfo from "@/wfc/model/groupInfo";
import GroupType from "@/wfc/model/groupType";
import GroupMemberType from "@/wfc/model/groupMemberType";
import QuoteInfo from "@/wfc/model/quoteInfo";
import Draft from "@/ui/util/draft";
import Mention from "../../../wfc/model/mention";
import {parser as emojiParse} from '@/ui/util/emoji';
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import avenginekitproxy from "@/wfc/av/engine/avenginekitproxy";
import {fileFromDataUri} from "@/ui/util/imageUtil";
import StickerMessageContent from "@/wfc/messages/stickerMessageContent";
import {config as emojiConfig} from "@/ui/main/conversation/EmojiAndStickerConfig";
import PickUserView from "@/ui/main/pick/PickUserView";
import {ipcRenderer, isElectron} from "@/platform";
import {copyText} from "../../util/clipboard";
import EventType from "../../../wfc/client/wfcEvent";
import IPCRendererEventType from "../../../ipcRendererEventType";

// vue 不允许在computed里面有副作用
// 和store.state.conversation.quotedMessage 保持同步
let lastQuotedMessage = null;

export default {
    name: "MessageInputView",
    props: {
        conversationInfo: {
            type: ConversationInfo,
            required: true,
            default: null,
        },
    },
    data() {
        return {
            sharedConversationState: store.state.conversation,
            sharedContactState: store.state.contact,
            sharedMiscState: store.state.misc,
            showEmojiDialog: false,
            tribute: null,
            mentions: [],
            emojiCategories: categoriesDefault,
            emojis: emojisDefault,
            lastConversationInfo: null,
            storeDraftIntervalId: 0,
            tributeReplaced: false,
        }
    },
    methods: {
        onTributeReplaced(e){
            // 正常下面这两行应当就生效了，不知道为啥不生效，所以采用了后面的 trick
            e.detail.event.preventDefault();
            e.detail.event.stopPropagation();

            this.tributeReplaced = true;
        },
        canisend() {
            let target = this.conversationInfo.conversation._target;
            if (target instanceof GroupInfo) {
                let groupInfo = target;
                if (groupInfo.type === GroupType.Restricted) {
                    let groupMember = wfc.getGroupMember(groupInfo.target, wfc.getUserId());
                    if (groupInfo.mute === 1 && groupMember.type === GroupMemberType.Normal) {
                        return false;
                    }
                }
            }

            return true;
        },

        cancelQuoteMessage() {
            store.quoteMessage(null)
        },

        async handlePaste(e, source) {
            let text;
            if ((e.originalEvent || e).clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData('text/plain');
            } else {
                text = await navigator.clipboard.readText();
            }
            if (source === 'menu' && text && text.trim()) {
                e.preventDefault();
                document.execCommand('insertText', false, text);
                return;
            }
            if (isElectron()) {
                let args = ipcRenderer.sendSync('file-paste');
                if (args.hasImage) {
                    e.preventDefault();
                    document.execCommand('insertImage', false, 'local-resource://' + args.filename);
                }
            }
        },
        copy() {
            let text = this.$refs['input'].innerText;
            if(text){
                copyText(text)
            }
        },

        cut() {
            this.copy();
            this.$refs['input'].innerHTML = '';
        },

        send(e) {
            if (this.tribute && this.tribute.isActive || this.tributeReplaced) {
                this.tributeReplaced = false;
                return;
            }

            // let text = this.$refs['input'].textContent;
            // if (!text.trim()) {
            //   return;
            // }
            // this.$refs['input'].textContent = '';
            // // 发送消息时，会话消息列表需要滚动到最后
            // store.setShouldAutoScrollToBottom(true)
            //
            // let textMessageContent = this.handleMention(text)
            // let conversation = this.conversationInfo.conversation;
            // wfc.sendConversationMessage(conversation, textMessageContent);
            //

            let input = this.$refs['input'];
            let message = input.innerHTML.trim();
            let conversation = this.conversationInfo.conversation;

            if (
                !conversation
                || !this.canisend()
                || !message
            ) return;

            if (e.ctrlKey) {
                // e.preventDefault();
                // this.refs.input.innerHTML = this.refs.input.innerHTML+ "<div><br></div>";
                document.execCommand('InsertHTML', true, '<br>');
                if (window.getSelection) {
                    let selection = window.getSelection(),
                        range = selection.getRangeAt(0),
                        br = document.createElement("br");
                    range.deleteContents();
                    range.insertNode(br);
                    range.setStartAfter(br);
                    range.setEndAfter(br);
                    // range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    // return false;
                }
                return;
            }

            // if(!message.startsWith('<')){
            //     message = message.replace(/<br>/g, '\n').trim()
            // }

            let imgs = [...input.getElementsByTagName('img')];
            if (imgs) {
                imgs.forEach(img => {
                    if (img.className.indexOf('emoji') >= 0) {
                        return;
                    }
                    let src = img.src;
                    let file;
                    if (isElectron()) {
                        file = src.substring(17, src.length);
                    } else {
                        file = fileFromDataUri(src, new Date().getTime() + '.png');
                    }
                    this.$eventBus.$emit('uploadFile', file)
                    store.sendFile(this.conversationInfo.conversation, file)
                    // 会影响 input.getElementsByTagName 返回的数组，所以上面拷贝了一下
                    img.parentNode.removeChild(img);
                });
            }
            message = input.innerHTML.trim();
            message = message.replace(/<br>/g, '\n')
                .replace(/<div>/g, '\n')
                .replace(/<\/div>/g, '')
                .replace(/&nbsp;/g, ' ');

            message = message.replace(/<img class="emoji" draggable="false" alt="/g, '')
                .replace(/" src="https:\/\/static\.wildfirechat\.net\/twemoji\/assets\/72x72\/[0-9a-z-]+\.png">/g, '')

            if (message && message.trim()) {
                let textMessageContent = this.handleMention(message);
                let quotedMessage = this.sharedConversationState.quotedMessage;
                if (quotedMessage) {
                    let quoteInfo = QuoteInfo.initWithMessage(quotedMessage);
                    textMessageContent.setQuoteInfo(quoteInfo);
                }
                wfc.sendConversationMessage(conversation, textMessageContent);
                this.$refs['input'].innerHTML = '';
            }

            input.innerHTML = '';
            store.quoteMessage(null);
            Draft.setConversationDraft(conversation, '', null, null);
            e.preventDefault();
        },

        toggleEmojiView() {
            this.showEmojiDialog = !this.showEmojiDialog;
            this.focusInput();
        },

        screenShot() {
            ipcRenderer.send('screenshots-start', {});
        },
        showMessageHistory() {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/conversation-message-history');
            } else {
                url += "/conversation-message-history"
            }
            let conversation = this.conversationInfo.conversation;
            ipcRenderer.send(IPCRendererEventType.showConversationMessageHistoryPage, {
                url: url,
                type: conversation.type,
                target: conversation.target,
                line: conversation.line,
            });
            console.log(IPCRendererEventType.showConversationMessageHistoryPage, url)
        },

        hideEmojiView(e) {
            if (e.target.id !== 'showEmoji') {
                this.showEmojiDialog = false;
            }
        },

        onSelectEmoji(emoji) {
            this.showEmojiDialog = false;
            if (emoji.data.indexOf('http') >= 0) {
                let sticker = new StickerMessageContent('', emoji.data, 200, 200)
                wfc.sendConversationMessage(this.conversationInfo.conversation, sticker);

                return;
            }

            this.$refs.input.focus();
            this.insertHTML(emojiParse(emoji.data));
            this.focusInput();
        },

        createElementFromHTML(htmlString) {
            let div = document.createElement('div');
            div.innerHTML = htmlString.trim();

            // Change this to div.childNodes to support multiple top-level nodes
            return div.firstChild;
        },


        insertHTML(html) {
            let sel, range;

            if (window.getSelection && (sel = window.getSelection())) {
                range = sel.getRangeAt(0);
                range.collapse(true);
                let imgEmoji = this.createElementFromHTML(html);
                range.insertNode(imgEmoji);

                // Move the caret immediately after the inserted span
                range.setStartAfter(imgEmoji);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && document.selection.createRange) {
                document.selection.createRange().text = html;
            }
        },

        pickFile() {
            this.$refs['fileInput'].click();
        },

        startAudioCall() {
            // TODO
            let conversation = this.conversationInfo.conversation;
            if (conversation.type === ConversationType.Single) {
                avenginekitproxy.startCall(conversation, true, [conversation.target])
            } else {
                this.startGroupVoip(true);
            }
        },

        startVideoCall() {
            // TODO
            let conversation = this.conversationInfo.conversation;
            if (conversation.type === ConversationType.Single) {
                avenginekitproxy.startCall(conversation, false, [conversation.target])
            } else {
                this.startGroupVoip(false);
            }
        },

        startGroupVoip(isAudioOnly) {
            let beforeOpen = (event) => {
                console.log('Opening...')
            }
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
                if (event.params.confirm) {
                    let newPickedUsers = event.params.users;
                    let participantIds = newPickedUsers.map(u => u.uid);
                    avenginekitproxy.startCall(this.conversationInfo.conversation, isAudioOnly, participantIds)
                }
            }

            let closed = (event) => {
                console.log('Close...', event)
            }

            this.$modal.show(
                PickUserView,
                {
                    users: store.getGroupMemberUserInfos(this.conversationInfo.conversation.target, true, true),
                    initialCheckedUsers: [this.sharedContactState.selfUserInfo],
                    uncheckableUsers: [this.sharedContactState.selfUserInfo],
                    confirmTitle: this.$t('common.confirm'),
                }, {
                    name: 'pick-user-modal',
                    width: 600,
                    height: 480,
                    clickToClose: false,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        },

        onPickFile(event) {
            // this.batchProcess(e.target.files[0]);
            console.log('onPickFile', event.target.files[0]);
            let file = event.target.files[0];
            event.target.value = '';

            // TODO
            // var showMessage = snackbar.showMessage;
            //
            // if (!file || file.size === 0) {
            //   showMessage('You can\'t send an empty file.');
            //   return false;
            // }
            //
            // if (!file
            //     || file.size >= 100 * 1024 * 1024) {
            //   showMessage('Send file not allowed to exceed 100M.');
            //   return false;
            // }
            this.$eventBus.$emit('uploadFile', file)
            store.sendFile(this.conversationInfo.conversation, file);
        },

        initEmojiPicker() {
            let config = emojiConfig();
            this.emojiCategories = config.emojiCategories;
            this.emojis = config.emojis;
        },

        initMention(conversation) {
            // TODO group, channel

            if (this.tribute) {
                this.tribute.detach(this.$refs['input']);
                this.tribute = null;
            }
            let type = conversation.conversationType;
            if (type === ConversationType.Single
                || type === ConversationType.ChatRoom) {
                return
            }

            let mentionMenuItems = [];
            let groupInfo = wfc.getGroupInfo(conversation.target);
            mentionMenuItems.push({
                key: this.$t('conversation.all_people'),
                value: '@' + conversation.target,
                avatar: groupInfo.portrait,
                //searchKey: '所有人' + pinyin.letter('所有人', '', null)
                searchKey: this.$t('conversation.all_people') + 'suoyouren' + 'syr'
            });

            let groupMemberUserInfos = store.getGroupMemberUserInfos(conversation.target, false);
            groupMemberUserInfos.forEach((e) => {
                mentionMenuItems.push({
                    key: e._displayName,
                    value: '@' + e.uid,
                    avatar: e.portrait,
                    searchKey: e._displayName + e._pinyin + e._firstLetters,
                });
            });

            this.tribute = new Tribute({
                values: mentionMenuItems,
                selectTemplate: (item) => {
                    if (typeof item === 'undefined') return null;
                    // if (this.range.isContentEditable(this.current.element)) {
                    //     return '<span contenteditable="false"><a href="http://zurb.com" target="_blank" title="' + item.original.email + '">' + item.original.value + '</a></span>';
                    // }
                    this.mentions.push({key: item.original.key, value: item.original.value});

                    return '@' + item.original.key;
                },
                menuItemTemplate: function (item) {
                    return '<img width="24" height="24" src="' + item.original.avatar + ' "> ' + item.original.key;
                },
                noMatchTemplate: function () {
                    return '<span style:"visibility: hidden;"></span>';
                },
                lookup: (item) => {
                    return item.searchKey;
                },
                menuContainer: document.getElementById('conversation-content'),
            });
            this.tribute.attach(this.$refs['input']);
        },

        handleMention(text) {
            let textMessageContent = new TextMessageContent();
            textMessageContent.content = text.trim();
            this.mentions.forEach(e => {
                if (text.indexOf(e.key) > -1) {
                    if (e.value === '@' + this.conversationInfo.conversation.target) {
                        textMessageContent.mentionedType = 2;
                    } else {
                        if (textMessageContent.mentionedType !== 2) {
                            textMessageContent.mentionedType = 1;
                            textMessageContent.mentionedTargets.push(e.value.substring(1));
                        }
                    }
                }
            });

            this.mentions.length = 0;
            return textMessageContent;
        },

        focusInput() {
            this.$nextTick(() => {
                this.$refs['input'].focus();
                console.log('focus end')
            })
        },

        moveCursorToEnd(contentEditableDiv) {

            let range = document.createRange();
            range.selectNodeContents(contentEditableDiv);
            range.collapse(false);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },

        restoreDraft() {
            let draft = Draft.getConversationDraftEx(this.conversationInfo);
            store.quoteMessage(draft.quotedMessage);
            let input = this.$refs['input'];
            input.innerHTML = draft.text.replace(/ /g, '&nbsp');
            this.moveCursorToEnd(input);
        },

        storeDraft(conversationInfo, quotedMessage) {
            let draftText = this.$refs['input'].innerHTML.trim();
            draftText = draftText
                .replace(/<br>/g, '')
                .replace(/<div>/g, '\n')
                .replace(/<\/div>/g, '')
                .replace(/<div><\/div>/g, '')
                .replace(/&nbsp;/g, '')
                .replace(/<img class="emoji" draggable="false" alt="/g, '')
                .replace(/" src="https:\/\/static\.wildfirechat\.net\/twemoji\/assets\/72x72\/[0-9a-z-]+\.png">/g, '')
                .trimStart()
                .replace(/\s+$/g, ' ')
            ;

            let mentions = [];
            this.mentions.forEach(e => {
                let mention;
                /**
                 *  e.key: "13866666666"
                 *  e.value: "@q0H7q7MM"
                 */
                let start = draftText.indexOf('@' + e.key);
                let end = start + 1 + e.key.length;
                if (start > -1) {
                    if (e.value === '@' + this.conversationInfo.conversation.target) {
                        mention = new Mention(start, end, this.conversationInfo.conversation.target, true)
                    } else {
                        mention = new Mention(start, end, e.value.substring(1), false)
                    }
                    mentions.push(mention);
                }
            });
            let mentionCount = this.mentions ? this.mentions.length : 0;
            if (mentionCount > 0
                && draftText.endsWith('@' + this.mentions[mentionCount - 1].key + ' ')) {
                // @的最后一个空格不能删除
                // do nothing
            } else {
                draftText = draftText.trimEnd();
            }

            let quoteInfo = quotedMessage ? QuoteInfo.initWithMessage(quotedMessage) : null;

            if (draftText.length === 0) {
                if (conversationInfo.draft !== '') {
                    Draft.setConversationDraft(conversationInfo.conversation, draftText, quoteInfo, mentions)
                }
            } else {
                if (draftText !== conversationInfo.draft) {
                    Draft.setConversationDraft(conversationInfo.conversation, draftText, quoteInfo, mentions)
                }
            }
        },

        onGroupMembersUpdate(groupId) {
            console.log('messageInput onGroupMembersUpdate', groupId)
            if (this.conversationInfo
                && this.conversationInfo.conversation.type === ConversationType.Group
                && this.conversationInfo.conversation.target === groupId) {
                this.initMention(this.conversationInfo.conversation);
            }
        }
    },

    activated() {
        this.restoreDraft();
        this.focusInput();
    },

    deactivated() {
        this.storeDraft(this.lastConversationInfo, lastQuotedMessage);
        this.$refs['input'].innerHTML = '';
    },

    mounted() {
        if (this.conversationInfo) {
            this.initMention(this.conversationInfo.conversation)
            this.initEmojiPicker()
            this.restoreDraft();
        }
        this.lastConversationInfo = this.conversationInfo;
        this.focusInput();

        if (isElectron()) {
            ipcRenderer.on('screenshots-ok', (event, args) => {
                console.log('screenshots-ok', args)
                if (args.filePath) {
                    setTimeout(()=> {
                    document.execCommand('insertImage', false, 'local-resource://' + args.filePath);
                    }, 100)
                }
            });
        }
        this.storeDraftIntervalId = setInterval(() => {
            this.storeDraft(this.conversationInfo, this.quotedMessage);
        }, 5 * 1000)
    },

    created() {
        wfc.eventEmitter.on(EventType.GroupMembersUpdate, this.onGroupMembersUpdate)
    },

    destroyed() {
        if (isElectron()) {
            ipcRenderer.removeAllListeners('screenshots-ok');
        }
        if (this.storeDraftIntervalId) {
            clearInterval(this.storeDraftIntervalId)
        }
        wfc.eventEmitter.removeListener(EventType.GroupMembersUpdate, this.onGroupMembersUpdate)
    },

    watch: {
        conversationInfo() {
            if (this.lastConversationInfo && !this.conversationInfo.conversation.equal(this.lastConversationInfo.conversation)) {
                this.storeDraft(this.lastConversationInfo, lastQuotedMessage);
            }

            if (this.conversationInfo && (!this.lastConversationInfo || !this.conversationInfo.conversation.equal(this.lastConversationInfo.conversation))) {
                this.restoreDraft();
                this.initMention(this.conversationInfo.conversation)
            }
            this.lastConversationInfo = this.conversationInfo;
            this.focusInput();
        },
    },

    computed: {
        quotedMessage() {
            lastQuotedMessage = this.sharedConversationState.quotedMessage;
            return this.sharedConversationState.quotedMessage;
        },

        hasInputTextOrImage() {
            // TODO 监听input的输入情况
            return true;
        }
    },

    components: {
        QuoteMessageView,
        VEmojiPicker
    },
    directives: {
        ClickOutside,
        focus,
    }
};
</script>

<style lang='css' scoped>
.message-input-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

#emoji {
    position: absolute;
    bottom: 55px;
}

/*pls refer to https://vue-loader.vuejs.org/guide/scoped-css.html#child-component-root-elements*/
#emoji >>> .container-emoji {
    height: 280px;
}

.input-action-container {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.input {
    flex: 1 1 auto;
    outline: none;
    padding: 0 20px;
    overflow: auto;
    user-select: text;
    -webkit-user-select: text;
}

.input:empty:before{
    content: attr(title);
    color: gray;
    font-size: 13px;
}

.input-action-container ul li {
    display: inline;
    margin-left: 20px;
}

.input-action-container ul li:last-of-type {
    margin-right: 20px;
}

i {
    font-size: 24px;
    color: #000;
    cursor: pointer;
}

i:hover {
    color: #34b7f1;
}

</style>

<style lang="css">
.input img {
    width: auto;
    max-width: 100px;
    max-height: 100px;
}
</style>
