<template>
    <div>
        <section ref="message-input-container" class="message-input-container" v-if="!sharedConversationState.showChannelMenu">
            <section class="input-action-container">
                <VEmojiPicker
                    id="emoji"
                    ref="emojiPicker"
                    v-if="showEmojiDialog"
                    labelSearch="Search"
                    lang="pt-BR"
                    v-click-outside="hideEmojiView"
                    :customEmojis="emojis"
                    :customCategories="emojiCategories"
                    @select="onSelectEmoji"
                />
                <ul>
                    <li v-if="!inputOptions['disableEmoji']">
                        <i id="showEmoji" @click="toggleEmojiView" class="icon-ion-ios-heart"/>
                    </li>
                    <li v-if="!inputOptions['disableFile']">
                        <i @click="pickFile" class="icon-ion-android-attach"/>
                        <input ref="fileInput" @change="onPickFile($event)" class="icon-ion-android-attach" type="file"
                               style="display: none">
                    </li>
                    <li v-if="!inputOptions['disableScreenShot'] && sharedMiscState.isElectron">
                        <div style="display: inline-block; text-align: center">
                            <i id="screenShot" @click="screenShot(false)" class="icon-ion-scissors"/>
                            <i class="icon-ion-chevron-down" style="font-size: 10px; color: #494849; padding-left: 5px;"/>
                            <span @click="screenShot(true)" class="screen-shot-button">隐藏当前窗口截图</span>
                        </div>
                    </li>
                    <li v-if="!inputOptions['disableHistory'] && sharedMiscState.isElectron">
                        <i id="messageHistory" @click="showMessageHistory" class="icon-ion-android-chat"/>
                    </li>
                    <li v-if="enablePtt">
                        <i id="ptt" @mousedown="requestPttTalk(true)" @mouseup="requestPttTalk(false)"
                           class="icon-ion-android-radio-button-on"/>
                    </li>
                    <li>
                        <i id="voice" @mousedown="recordAudio(true)" @mouseup="recordAudio(false)"
                           class="icon-ion-android-microphone"/>
                    </li>
                </ul>
                <ul v-if="!inputOptions['disableVoip'] && sharedContactState.selfUserInfo.uid !== conversationInfo.conversation.target">
                    <li v-if="!inputOptions['disableAudioCall']">
                        <i @click="startAudioCall" class="icon-ion-ios-telephone"/>
                    </li>
                    <li v-if="!inputOptions['disableVideoCall']">
                        <i @click="startVideoCall" class="icon-ion-ios-videocam"/>
                    </li>
                    <li v-if="!inputOptions['disableChannelMenu'] && conversationInfo.conversation.type === 3 && conversationInfo.conversation._target.menus && conversationInfo.conversation._target.menus.length">
                        <i @click="toggleChannelMenu" class="icon-ion-android-menu"/>
                    </li>
                </ul>
            </section>
            <div @keydown.13="send($event)"
                 @keydown.229="()=>{}"
                 ref="input" class="input"
                 @paste="handlePaste"
                 draggable="false"
                 title="Enter发送，Ctrl+Enter换行"
                 autofocus
                 @input="onInput"
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
            <div v-if="muted"
                 style="width: 100%; height: 100%; background: lightgrey; position: absolute; display: flex; justify-content: center; align-items: center">
                <p style="color: white">群禁言或者你被禁言</p>
            </div>
        </section>
        <ChannelMenuView v-else :menus="conversationInfo.conversation._target.menus"
                         :conversation="conversationInfo.conversation"></ChannelMenuView>
    </div>
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
import GroupMemberType from "@/wfc/model/groupMemberType";
import QuoteInfo from "@/wfc/model/quoteInfo";
import Draft from "@/ui/util/draft";
import Mention from "../../../wfc/model/mention";
import {parser as emojiParse} from '@/ui/util/emoji';
import QuoteMessageView from "@/ui/main/conversation/message/QuoteMessageView";
import {fileFromDataUri} from "@/ui/util/imageUtil";
import StickerMessageContent from "@/wfc/messages/stickerMessageContent";
import {config as emojiConfig} from "@/ui/main/conversation/EmojiAndStickerConfig";
import {ipcRenderer, isElectron} from "@/platform";
import {copyText} from "../../util/clipboard";
import EventType from "../../../wfc/client/wfcEvent";
import IpcEventType from "../../../ipcEventType";
import ChannelMenuView from "./ChannelMenuView";
import IpcSub from "../../../ipc/ipcSub";
import pttClient from "../../../wfc/ptt/client/pttClient";
import TalkingCallback from "../../../wfc/ptt/client/talkingCallback";
import Config from "../../../config";
import SoundMessageContent from "../../../wfc/messages/soundMessageContent";
import BenzAMRRecorder from "benz-amr-recorder";
import TypingMessageContent from "../../../wfc/messages/typingMessageContent";
import {currentWindow} from "../../../platform";

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
        inputOptions: {
            type: Object,
            required: false,
            default: () => ({}),
        }
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
            enablePtt: wfc.isCommercialServer() && Config.ENABLE_PTT,
            amrRecorder: null,
            lastTypingMessageTimestamp: 0,
        }
    },
    methods: {
        onTributeReplaced(e) {
            // 正常下面这两行应当就生效了，不知道为啥不生效，所以采用了后面的 trick
            e.detail.event.preventDefault();
            e.detail.event.stopPropagation();

            this.tributeReplaced = true;
        },
        canisend() {
            let target = this.conversationInfo.conversation._target;
            if (target instanceof GroupInfo) {
                let groupInfo = target;
                let groupMember = wfc.getGroupMember(groupInfo.target, wfc.getUserId());
                if (groupInfo.mute === 1) {
                    return [GroupMemberType.Owner, GroupMemberType.Manager, GroupMemberType.Allowed].indexOf(groupMember.type) >= 0
                        || groupMember.type === GroupMemberType.Allowed;
                }
            }

            return true;
        },

        cancelQuoteMessage() {
            store.quoteMessage(null)
        },

        onInput(e) {
            this.notifyTyping(TypingMessageContent.TYPING_TEXT);
        },

        notifyTyping(type) {
            if ([ConversationType.Single, ConversationType.Group].indexOf(this.conversationInfo.conversation.type) >= 0) {
                let now = new Date().getTime();
                if (now - this.lastTypingMessageTimestamp > 10 * 1000) {
                    let typing = new TypingMessageContent(type);
                    wfc.sendConversationMessage(this.conversationInfo.conversation, typing)
                    this.lastTypingMessageTimestamp = now;
                }
            }
        },
        async handlePaste(e, source) {
            let text;
            e.preventDefault();

            if ((e.originalEvent || e).clipboardData) {
                text = (e.originalEvent || e).clipboardData.getData('text/plain');
            } else {
                text = await navigator.clipboard.readText();
            }
            console.log('handlePaste', e, source);
            if (isElectron()) {
                let args = ipcRenderer.sendSync(IpcEventType.FILE_PASTE);
                if (args.hasImage) {
                    document.execCommand('insertText', false, ' ');
                    document.execCommand('insertImage', false, 'local-resource://' + args.filename);
                    return;
                } else if (args.hasFile) {
                    args.files.forEach(file => {
                        store.sendFile(this.conversationInfo.conversation, file)
                    })
                    return;
                }
            } else {
                const dT = e.clipboardData || window.clipboardData;
                if (dT) {
                    const file = dT.files[0];
                    if (file) {
                        if (file.type.indexOf('image') !== -1) {
                            // image
                            document.execCommand('insertImage', false, URL.createObjectURL(file));
                        } else {
                            // file
                            store.sendFile(this.conversationInfo.conversation, file)
                        }
                        return;
                    }
                    console.log('handle paste file', file);
                } else {
                    const clipboardContents = await navigator.clipboard.read();
                    for (const item of clipboardContents) {
                        console.log('clipboard item', item.types, item)
                        if (item.types.includes("image/png")) {
                            const blob = await item.getType("image/png");
                            document.execCommand('insertImage', false, URL.createObjectURL(blob));
                            return;
                        }
                    }
                }
            }

            if (text && text.trim()) {
                document.execCommand('insertText', false, text);
                // Safari 浏览器 execCommand 失效，可以采用下面这种方式处理粘贴
                // this.$refs.input.innerText += text;
            }
        },

        mention(groupId, memberId) {
            let displayName = wfc.getGroupMemberDisplayName(groupId, memberId);
            this.mentions.push({
                key: displayName,
                value: '@' + memberId,
            })
            let text = this.$refs.input.innerText;
            let mentionValue;
            if (text.endsWith(' ')) {
                mentionValue = '@' + displayName + ' ';
            } else {
                mentionValue = ' @' + displayName + ' ';
            }
            document.execCommand('insertText', false, mentionValue);
        },

        insertText(text) {
            // this.$refs['input'].innerText = text;
            this.$refs.input.focus();
            document.execCommand('insertText', false, text);
        },

        copy() {
            let text = this.$refs['input'].innerText;
            if (text) {
                copyText(text)
            }
        },

        cut() {
            this.copy();
            this.$refs['input'].innerHTML = '';
        },

        async send(e) {
            if (this.tribute && this.tribute.isActive) {
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
                if (window.getSelection) {
                    let nextChar = window.getSelection().focusNode.textContent.charAt(window.getSelection().focusOffset)
                    if (!nextChar) {
                        document.execCommand('InsertHTML', true, '<br>');
                    }

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
                for (const img of imgs) {
                    if (img.className.indexOf('emoji') >= 0) {
                        continue;
                    }
                    let src = img.src;
                    let file;
                    if (isElectron()) {
                        // 'local-resource://' + 绝对路径
                        file = decodeURI(src.substring(17, src.length));
                    } else {
                        if (src.startsWith('blob:')) {
                            let blob = await fetch(src).then(r => r.blob());
                            file = new File([blob], new Date().getTime() + '.png');
                        } else {
                            file = fileFromDataUri(src, new Date().getTime() + '.png');
                        }
                    }
                    this.$eventBus.$emit('uploadFile', file)
                    store.setShouldAutoScrollToBottom(true);
                    store.sendFile(this.conversationInfo.conversation, file)
                    // 会影响 input.getElementsByTagName 返回的数组，所以上面拷贝了一下
                    img.parentNode.removeChild(img);
                }
            }
            message = input.innerHTML.trim();
            message = message.replace(/<br>/g, '\n')
                .replace(/<div>/g, '\n')
                .replace(/<\/div>/g, '')
                .replace(/<b>/g, '')
                .replace(/<\/b>/g, '')
                .replace(/&nbsp;/g, ' ');


            //  自行部署表情时，需要手动替换下面的正则
            // TODO 在正则中使用变量，避免手动替换
            let p = `" src="${Config.emojiBaseUrl()}72x72\\/[0-9a-z-]+\\.png">`
            let re = new RegExp(p, 'g');
            message = message.replace(/<img class="emoji" draggable="false" alt="/g, '')
                .replace(re, '')

            if (message && message.trim()) {
                let textMessageContent = this.handleMention(message);
                let quotedMessage = this.sharedConversationState.quotedMessage;
                if (quotedMessage) {
                    let quoteInfo = QuoteInfo.initWithMessage(quotedMessage);
                    textMessageContent.setQuoteInfo(quoteInfo);
                }
                store.setShouldAutoScrollToBottom(true);
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

        screenShot(hideCurrentWindow = false) {
            if (hideCurrentWindow) {
                currentWindow.hide();
            }
            console.log('screenShot', hideCurrentWindow);
            ipcRenderer.send(IpcEventType.START_SCREEN_SHOT, {});
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
            ipcRenderer.send(IpcEventType.showConversationMessageHistoryPage, {
                url: url,
                type: conversation.type,
                target: conversation.target,
                line: conversation.line,
            });
            console.log(IpcEventType.showConversationMessageHistoryPage, url)
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
            this.notifyTyping(TypingMessageContent.TYPING_FILE);
        },

        startAudioCall() {
            console.log(`startAudioCall from mainWindow ${this.sharedMiscState.isMainWindow}`);
            let conversation = this.conversationInfo.conversation;
            if (this.sharedMiscState.isMainWindow) {
                this.$startVoipCall({audioOnly: true, conversation: conversation});
            } else {
                IpcSub.startVoipCall(conversation, true);
            }
        },

        startVideoCall() {
            console.log(`startVideoCall from mainWindow ${this.sharedMiscState.isMainWindow}`);
            let conversation = this.conversationInfo.conversation;
            if (this.sharedMiscState.isMainWindow) {
                this.$startVoipCall({audioOnly: false, conversation: conversation});
            } else {
                IpcSub.startVoipCall(conversation, false);
            }
        },

        toggleChannelMenu(toggle = true) {
            if (toggle) {
                this.$parent.$refs['conversationMessageList'].style.flexGrow = 1;
                this.storeDraft(this.lastConversationInfo, lastQuotedMessage);
            } else {
                if (this.$parent.messageInputViewResized) {
                    this.$parent.$refs['conversationMessageList'].style.flexGrow = 0;
                }
            }
            store.toggleChannelMenu(toggle);
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
            if (isElectron()) {
                if (new Date().getTime() - file.lastModified < 30 * 1000 && file.path.indexOf('/var/folders') === 0) {
                    console.log('not support file', file)
                    this.$notify({
                        text: ' 不支持的文件类型',
                        type: 'warn'
                    });
                    return;
                }
            }
            this.$eventBus.$emit('uploadFile', file)
            store.sendFile(this.conversationInfo.conversation, file);
        },

        initEmojiPicker() {
            window.__twemoji_base_url__ = Config.emojiBaseUrl();
            let config = emojiConfig();
            if (this.conversationInfo.conversation.type === ConversationType.SecretChat) {
                this.emojiCategories = config.emojiCategories.filter(c => !c.name.startsWith('Sticker'));
                this.emojis = config.emojis.filter(c => !c.category.startsWith('Sticker'));
                this.$refs.emojiPicker.changeCategory({name: 'Peoples'});
            } else {
                this.emojiCategories = config.emojiCategories;
                this.emojis = config.emojis;
            }
        },

        initMention(conversation) {
            // TODO group, channel

            if (this.tribute) {
                this.tribute.detach(this.$refs['input']);
                this.tribute = null;
            }
            let type = conversation.conversationType;
            if (type === ConversationType.Single
                || type === ConversationType.ChatRoom || type === ConversationType.Channel) {
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
                if (this.$refs['input']) {
                    this.$refs['input'].focus();
                    console.log('focus end')
                }
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
            if (!draft) {
                return;
            }
            console.log('restore draft', this.conversationInfo, draft);
            store.quoteMessage(draft.quotedMessage);
            let input = this.$refs['input'];
            if (input.innerHTML.trim()) {
                console.log('inputting, ignore', draft.text)
            } else {
                input.innerHTML = draft.text.replace(/ /g, '&nbsp').replace(/\n/g, '<br>');
                this.moveCursorToEnd(input);
            }
        },

        storeDraft(conversationInfo, quotedMessage) {
            if (!this.$refs['input']) {
                return;
            }
            let draftText = this.$refs['input'].innerHTML.trim();
            let p = `" src="${Config.emojiBaseUrl()}72x72\\/[0-9a-z-]+\\.png">`
            let re = new RegExp(p, 'g');
            draftText = draftText
                .replace(/<br>/g, '\n')
                .replace(/<div>/g, '\n')
                .replace(/<\/div>/g, '')
                .replace(/<div><\/div>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/<img class="emoji" draggable="false" alt="/g, '')
                .replace(re, '')
                .replace(/<img src="local-resource:.*">/g, '')
                .trimStart()
                .replace(/\s+$/g, ' ');

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

        onGroupMembersUpdate(groupId, groupMembers) {
            console.log('messageInput onGroupMembersUpdate', groupId)
            if (this.conversationInfo
                && this.conversationInfo.conversation.type === ConversationType.Group
                && this.conversationInfo.conversation.target === groupId) {
                this.initMention(this.conversationInfo.conversation);
                let groupMember = wfc.getGroupMember(groupId, wfc.getUserId());
                if (groupMember && groupMember.type === GroupMemberType.Muted) {
                    this.muted = true;
                }
            }
        },

        requestPttTalk(request) {
            if (request) {
                let talkingCallback = new TalkingCallback();
                talkingCallback.onStartTalking = (conversation) => {
                    console.log('onStartTalking', conversation)
                    this.$notify({
                        text: '请开始说话',
                        type: 'info'
                    });
                };
                talkingCallback.onRequestFail = (conversation, reason) => {
                    this.$notify({
                        text: '对讲请求失败: ' + reason,
                        type: 'error'
                    });
                }
                pttClient.requestTalk(this.conversationInfo.conversation, talkingCallback)
            } else {
                pttClient.releaseTalk(this.conversationInfo.conversation);
            }
        },

        recordAudio(start) {
            this.notifyTyping(TypingMessageContent.TYPING_VOICE);
            if (start) {
                if (!this.amrRecorder) {
                    this.amrRecorder = new BenzAMRRecorder();
                    this.amrRecorder.initWithRecord().then(() => {
                        this.amrRecorder.startRecord();
                        this.$notify({
                            text: '请开始说话',
                            type: 'info'
                        });
                    }).catch((e) => {
                        this.$notify({
                            text: '录音失败',
                            type: 'error'
                        });
                        console.log('录音失败', e);
                        this.amrRecorder = null;
                    });
                }
            } else {
                if (this.amrRecorder) {
                    this.amrRecorder.finishRecord().then(() => {
                        let duration = this.amrRecorder.getDuration();
                        if (duration > 1) {
                            let blob = this.amrRecorder.getBlob();
                            let file = new File([blob], new Date().getTime() + '.amr');
                            let content = new SoundMessageContent(file, null, Math.ceil(duration));
                            wfc.sendConversationMessage(this.conversationInfo.conversation, content);
                        } else {
                            this.$notify({
                                text: '录音时间太短',
                                type: 'warn'
                            });
                        }
                        this.amrRecorder = null;
                    });
                }
            }
        },
    },

    activated() {
        if (!this.sharedConversationState.showChannelMenu) {
            this.restoreDraft();
            this.focusInput();
        }
    },

    deactivated() {
        if (!this.sharedConversationState.showChannelMenu) {
            this.storeDraft(this.lastConversationInfo, lastQuotedMessage);
            this.$refs['input'].innerHTML = '';
        }
    },

    mounted() {
        if (!this.sharedConversationState.showChannelMenu) {
            if (this.conversationInfo) {
                this.initMention(this.conversationInfo.conversation)
                this.initEmojiPicker()
                this.restoreDraft();
            }
            this.focusInput();
        }
        this.lastConversationInfo = this.conversationInfo;

        if (isElectron()) {
            ipcRenderer.on('screenshots-ok', (event, args) => {
                console.log('screenshots-ok', args)
                if (args.filePath) {
                    setTimeout(() => {
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
                this.$nextTick(() => {
                    if (this.sharedConversationState.showChannelMenu) {
                        this.$parent.$refs['conversationMessageList'].style.flexGrow = 1;
                        return
                    }
                    if (this.$parent.messageInputViewResized) {
                        this.$parent.$refs['conversationMessageList'].style.flexGrow = 0;
                    }
                    if (this.lastConversationInfo && !this.conversationInfo.conversation.equal(this.lastConversationInfo.conversation)) {
                        this.storeDraft(this.lastConversationInfo, lastQuotedMessage);
                    }

                    if (this.conversationInfo && (!this.lastConversationInfo || !this.conversationInfo.conversation.equal(this.lastConversationInfo.conversation))) {
                        this.$refs.input.innerHTML = '';
                        this.restoreDraft();
                        this.initMention(this.conversationInfo.conversation)
                    }
                    this.lastConversationInfo = this.conversationInfo;
                    this.focusInput();
                    this.initEmojiPicker()
                })
            } else {
                // 其他端更新了草稿
                this.restoreDraft();
            }
        },
    },

    computed: {
        quotedMessage() {
            lastQuotedMessage = this.sharedConversationState.quotedMessage;
            // side affect
            this.$refs.input && this.$refs.input.focus();
            return this.sharedConversationState.quotedMessage;
        },

        hasInputTextOrImage() {
            // TODO 监听input的输入情况
            return true;
        },
        muted() {
            let target = this.conversationInfo.conversation._target;
            if (target instanceof GroupInfo) {
                let groupInfo = target;
                let groupMember = wfc.getGroupMember(groupInfo.target, wfc.getUserId());
                if (groupInfo.mute === 1) {
                    return [GroupMemberType.Owner, GroupMemberType.Manager, GroupMemberType.Allowed].indexOf(groupMember.type) < 0;
                } else {
                    return groupMember && groupMember.type === GroupMemberType.Muted;
                }
            }
            return false;
        },
    },

    components: {
        ChannelMenuView,
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
    height: 180px;
    min-height: 180px;
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
    font-size: 13px;
}

.input:empty:before {
    content: attr(title);
    color: gray;
    font-size: 13px;
}

.input-action-container ul li {
    display: inline;
    margin-left: 20px;
    position: relative;
}

.input-action-container ul li:last-of-type {
    margin-right: 20px;
}

i {
    font-size: 24px;
    color: #000b;
    cursor: pointer;
}

i:hover {
    color: #3f64e4;
}

.input-action-container ul li .screen-shot-button {
    position: absolute;
    left: 0;
    top: 100%;
    display: none;
    padding: 5px 10px;
    font-size: 12px;
    background-color: #b8b8b8;
    border-radius: 5px;
    color: #fff;
}

.input-action-container ul li:hover .screen-shot-button {
    display: inline-block;
    width: 120px;
}

</style>

<style lang="css">
.input img {
    width: auto;
    max-width: 100px;
    max-height: 100px;
}
</style>
