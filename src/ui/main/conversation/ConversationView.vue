<template>
  <section>
    <div v-if="sharedConversationState.currentConversationInfo == null" class="conversation-empty-container">
      <h1>^~^</h1>
    </div>
    <div v-else class="conversation-container">
      <header>
        <div class="title-container">
          <h1 class="single-line">{{ conversationTitle }}</h1>
          <a href="#"><i class="icon-ion-ios-settings-strong"
                         style="display: inline-block"
                         v-bind:style="{marginTop:sharedMiscState.isElectronWindowsOrLinux ?  '30px' : '0'}"
                         ref="setting"
                         @click="toggleConversationInfo"/></a>
        </div>
      </header>
      <div ref="conversationContentContainer" class="conversation-content-container"
           @dragover="dragEvent($event, 'dragover')"
           @dragleave="dragEvent($event, 'dragleave')"
           @dragenter="dragEvent($event,'dragenter')"
           @drop="dragEvent($event, 'drop')"
      >
        <div v-show="dragAndDropEnterCount > 0" class="drag-drop-container">
          <div class="drag-drop">
            <p>{{ $t('conversation.drag_to_send_to', [conversationTitle]) }}</p>
          </div>
        </div>
        <div ref="conversationMessageList" class="conversation-message-list" v-on:scroll="onScroll" infinite-wrapper>
          <infinite-loading :identifier="loadingIdentifier" force-use-infinite-wrapper direction="top"
                            @infinite="infiniteHandler">
            <!--            <template slot="spinner">加载中...</template>-->
            <template slot="no-more">{{$t('conversation.no_more_message')}}</template>
            <template slot="no-results">{{$t('conversation.all_message_load')}}</template>
          </infinite-loading>
          <ul>
            <!--todo item.messageId or messageUid as key-->
            <li v-for="(message) in sharedConversationState.currentConversationMessageList"
                :key="message.messageId">
              <!--todo 不同的消息类型 notification in out-->

              <NotificationMessageContentView :message="message" v-if="isNotificationMessage(message)"/>
              <NormalOutMessageContentView
                  @click.native.capture="sharedConversationState.enableMessageMultiSelection? clickMessageItem($event, message) : null"
                  :message="message"
                  v-else-if="message.direction === 0"/>
              <NormalInMessageContentView
                  @click.native.capture="sharedConversationState.enableMessageMultiSelection ? clickMessageItem($event, message) : null"
                  :message="message"
                  v-else/>
            </li>
          </ul>
        </div>
        <div v-if="sharedConversationState.inputtingUser" class="inputting-container">
          <img class="avatar" :src="sharedConversationState.inputtingUser.portrait"/>
          <ScaleLoader :color="'#d2d2d2'" :height="'15px'" :width="'3px'"/>
        </div>
        <div v-show="!sharedConversationState.enableMessageMultiSelection" v-on:mousedown="dragStart"
             class="divider-handler"></div>
        <MessageInputView :conversationInfo="sharedConversationState.currentConversationInfo"
                          v-show="!sharedConversationState.enableMessageMultiSelection"
                          class="message-input-container"/>
        <MultiSelectActionView v-show="sharedConversationState.enableMessageMultiSelection"/>
        <SingleConversationInfoView
            v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 0"
            v-click-outside="hideConversationInfo"
            :conversation-info="sharedConversationState.currentConversationInfo"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />
        <GroupConversationInfoView
            v-if="showConversationInfo &&  sharedConversationState.currentConversationInfo.conversation.type === 1"
            v-click-outside="hideConversationInfo"
            :conversation-info="sharedConversationState.currentConversationInfo"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />

        <vue-context ref="menu" v-slot="{data:message}" :close-on-scroll="true" v-on:close="onMenuClose">
          <!--          更多menu item-->
          <li v-if="isCopyable(message)">
            <a @click.prevent="copy(message)">{{$t('common.copy')}}</a>
          </li>
          <li>
            <a @click.prevent="delMessage(message)">{{$t('common.delete')}}</a>
          </li>
          <li v-if="isForwardable(message)">
            <a @click.prevent="forward(message)">{{$t('common.forward')}}</a>
          </li>
          <li v-if="isFavable">
            <a @click.prevent="">{{$t('common.fav')}}</a>
          </li>
          <li>
            <a @click.prevent="quoteMessage(message)">{{$t('common.quote')}}</a>
          </li>
          <li>
            <a @click.prevent="multiSelect(message)">{{$t('common.multi_select')}}</a>
          </li>
          <li v-if="isRecallable(message)">
            <a @click.prevent="recallMessage(message)">{{$t('common.recall')}}</a>
          </li>
          <li v-if="isLocalFile(message)">
            <a @click.prevent="openFile(message)">{{$t('common.open')}}</a>
          </li>
          <li v-if="isLocalFile(message)">
            <a @click.prevent="openDir(message)">{{$t('common.open_dir')}}</a>
          </li>
        </vue-context>
      </div>
    </div>
  </section>
</template>

<script>
import SingleConversationInfoView from "@/ui/main/conversation/SingleConversationInfoView";
import GroupConversationInfoView from "@/ui/main/conversation/GroupConversationInfoView";
import MessageInputView from "@/ui/main/conversation/MessageInputView";
import ClickOutside from 'vue-click-outside'
import NormalOutMessageContentView from "@/ui/main/conversation/message/NormalOutMessageContentContainerView";
import NormalInMessageContentView from "@/ui/main/conversation/message/NormalInMessageContentContainerView";
import NotificationMessageContentView from "@/ui/main/conversation/message/NotificationMessageContentView";
import NotificationMessageContent from "@/wfc/messages/notification/notificationMessageContent";
import TextMessageContent from "@/wfc/messages/textMessageContent";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import {numberValue} from "@/wfc/util/longUtil";
import InfiniteLoading from 'vue-infinite-loading';
import MultiSelectActionView from "@/ui/main/conversation/MessageMultiSelectActionView";
import ForwardMessageByPickConversationView
  from "@/ui/main/conversation/message/forward/ForwardMessageByPickConversationView";
import ForwardMessageByCreateConversationView
  from "@/ui/main/conversation/message/forward/ForwardMessageByCreateConversationView";
import ScaleLoader from 'vue-spinner/src/ScaleLoader'
import ForwardType from "@/ui/main/conversation/message/forward/ForwardType";
import {fs, isElectron, shell} from "@/platform";
import FileMessageContent from "@/wfc/messages/fileMessageContent";
import ImageMessageContent from "@/wfc/messages/imageMessageContent";
import {copyImg, copyText} from "@/ui/util/clipboard";
import Message from "../../../wfc/messages/message";

export default {
  components: {
    MultiSelectActionView,
    NotificationMessageContentView,
    NormalInMessageContentView,
    NormalOutMessageContentView,
    MessageInputView,
    GroupConversationInfoView,
    SingleConversationInfoView,
    InfiniteLoading,
    ScaleLoader,
  },
  // props: ["conversation"],
  data() {
    return {
      conversationInfo: null,
      showConversationInfo: false,
      sharedConversationState: store.state.conversation,
      sharedContactState: store.state.contact,
      sharedPickState: store.state.pick,
      sharedMiscState: store.state.misc,
      isHandlerDragging: false,

      savedMessageListViewHeight: -1,
      saveMessageListViewFlexGrow: -1,

      dragAndDropEnterCount: 0,
    };
  },

  methods: {
    dragEvent(e, v) {
      if (v === 'dragenter') {
        this.dragAndDropEnterCount++;
      } else if (v === 'dragleave') {
        this.dragAndDropEnterCount--;
      } else if (v === 'drop') {
        this.dragAndDropEnterCount--;
        let length = e.dataTransfer.files.length;
        if (length > 0 && length < 5) {
          for (let i = 0; i < length; i++) {
              this.$eventBus.$emit('uploadFile', e.dataTransfer.files[i])
            store.sendFile(this.sharedConversationState.currentConversationInfo.conversation, e.dataTransfer.files[i]);
          }
        } else {
          // TODO
          // toast
          console.log(this.$t('conversation.drag_to_send_limit_tip'));
        }
      } else if (v === 'dragover') {
        // If not st as 'copy', electron will open the drop file
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    toggleConversationInfo() {
      this.showConversationInfo = !this.showConversationInfo;
    },

    toggleMessageMultiSelectionActionView(message) {
      if (!this.sharedConversationState.enableMessageMultiSelection) {
        this.saveMessageListViewFlexGrow = this.$refs['conversationMessageList'].style.flexGrow;
        this.savedMessageListViewHeight = this.$refs['conversationMessageList'].style.height;
        this.$refs['conversationMessageList'].style.flexGrow = 1;
      } else {
        if (this.saveMessageListViewFlexGrow !== -1 && this.savedMessageListViewHeight !== -1) {
          this.$refs['conversationMessageList'].style.height = this.savedMessageListViewHeight;
          this.$refs['conversationMessageList'].style.flexGrow = this.saveMessageListViewFlexGrow;
        }
      }
      this.sharedPickState.messages.forEach(m => console.log(m.messageId));
      store.toggleMessageMultiSelection(message);
    },

    clickMessageItem(event, message) {
      if (message.messageContent instanceof NotificationMessageContent) {
        return;
      }
      if (this.sharedConversationState.enableMessageMultiSelection) {
        store.selectOrDeselectMessage(message);
        event.stopPropagation();
      }
    },

    hideConversationInfo() {
      // TODO
      // 是否在创建群聊，或者是在查看会话参与者信息
      this.showConversationInfo && (this.showConversationInfo = false);
    },

    isNotificationMessage(message) {
      return message && message.messageContent instanceof NotificationMessageContent;
    },

    openMessageContextMenu(event, message) {
      if (!message || message.messageContent instanceof NotificationMessageContent) {
        return;
      }
      this.$refs.menu.open(event, message);
    },

    onScroll(e) {
      // hide tippy userCard
      for (const popper of document.querySelectorAll('.tippy-popper')) {
        const instance = popper._tippy;
        if (instance.state.isVisible) {
          instance.hide();
        }
      }
      // hide message context menu
      this.$refs.menu && this.$refs.menu.close();

      // 当用户往上滑动一段距离之后，收到新消息，不自动滚到到最后
      if (e.target.scrollHeight > e.target.clientHeight + e.target.scrollTop + e.target.clientHeight / 2) {
        store.setShouldAutoScrollToBottom(false)
      } else {
        store.setShouldAutoScrollToBottom(true)
      }
    },

    dragStart() {
      this.isHandlerDragging = true;
      console.log('drag start')
    },

    drag(e) {
      // Don't do anything if dragging flag is false
      if (!this.isHandlerDragging) {
        return false;
      }

      // Get offset
      let containerOffsetTop = this.$refs['conversationContentContainer'].offsetTop;

      // Get x-coordinate of pointer relative to container
      let pointerRelativeYpos = e.clientY - containerOffsetTop;

      // Arbitrary minimum width set on box A, otherwise its inner content will collapse to width of 0
      let boxAminHeight = 150;

      // Resize box A
      // * 8px is the left/right spacing between .handler and its inner pseudo-element
      // * Set flex-grow to 0 to prevent it from growing
      this.$refs['conversationMessageList'].style.height = (Math.max(boxAminHeight, pointerRelativeYpos)) + 'px';
      this.$refs['conversationMessageList'].style.flexGrow = 0;

    },

    dragEnd() {
      this.isHandlerDragging = false;
    },

    onMenuClose() {
      console.log('xxoxooojjo')
    },

    // message context menu
    isCopyable(message) {
      return message && (message.messageContent instanceof TextMessageContent || message.messageContent instanceof ImageMessageContent);
    },

    isForwardable(message) {
      return true;
    },

    isFavable(message) {
      return true;
    },

    isRecallable(message) {
      return message && message.direction === 0 && new Date().getTime() - numberValue(message.timestamp) < 60 * 1000;
    },

    isLocalFile(message) {
      if (message && isElectron()) {
        let file = message.messageContent;
        if (file instanceof FileMessageContent) {
          return fs.existsSync(file.localPath);
        }
      }
      return false;
    },

    copy(message) {
      let content = message.messageContent;
      if (content instanceof TextMessageContent) {
        copyText(content.content)
      } else {
        copyImg(content.remotePath)
      }
    },

    openFile(message) {
      let file = message.messageContent;
      shell.openItem(file.localPath);
    },

    openDir(message) {
      let file = message.messageContent;
      shell.showItemInFolder(file.localPath);
    },

    recallMessage(message) {
      wfc.recallMessage(message.messageUid, null, null);
    },

    delMessage(message) {
      wfc.deleteMessage(message.messageId);
    },

    forward(message) {
      this.pickConversationAndForwardMessage(ForwardType.NORMAL, [message]);
    },

    quoteMessage(message) {
      store.quoteMessage(message);
    },

    multiSelect(message) {
      this.toggleMessageMultiSelectionActionView(message);
    },

    infiniteHandler($state) {
      console.log('to load more message');
      store.loadConversationHistoryMessages(() => {
        console.log('loaded')
        $state.loaded();
      }, () => {
        console.log('complete')
        $state.complete()
      });
    },

    pickConversationAndForwardMessage(forwardType, messages) {
      let beforeClose = (event) => {
        console.log('Closing...', event, event.params)
        // What a gamble... 50% chance to cancel closing
        if (event.params.toCreateConversation) {
          console.log('to show')
          this.createConversationAndForwardMessage(forwardType, messages)
        } else if (event.params.confirm) {
          let conversations = event.params.conversations;
          let extraMessageText = event.params.extraMessageText;
          // TODO 多选转发
          store.forwardMessage(forwardType, conversations, messages, extraMessageText)
        } else {
          console.log('cancel')
          // TODO clear pick state
        }
      };

      this.$modal.show(
          ForwardMessageByPickConversationView,
          {
            forwardType: forwardType,
            messages: messages
          }, {
            name: 'forward-by-pick-conversation-modal',
            width: 600,
            height: 480,
            clickToClose: false,
          }, {
            'before-close': beforeClose,
          })
    },

    createConversationAndForwardMessage(forwardType, messages) {
      let beforeClose = (event) => {
        console.log('Closing...', event, event.params)
        if (event.params.backPickConversation) {
          this.pickConversationAndForwardMessage(forwardType, messages)
        } else if (event.params.confirm) {
          let users = event.params.users;
          let extraMessageText = event.params.extraMessageText;
          store.forwardByCreateConversation(forwardType, users, messages, extraMessageText)
        } else {
          console.log('cancel')
        }
      };
      this.$modal.show(
          ForwardMessageByCreateConversationView,
          {
            forwardType: forwardType,
            messages: messages,
            users: this.sharedContactState.friendList,
          }, {
            name: 'forward-by-create-conversation-modal',
            width: 600,
            height: 480,
            clickToClose: false,
          }, {
            'before-close': beforeClose,
          })
    },
  },

  mounted() {
    this.popupItem = this.$refs['setting'];
    document.addEventListener('mouseup', this.dragEnd);
    document.addEventListener('mousemove', this.drag);

    this.$on('openMessageContextMenu', function (event, message) {
      this.$refs.menu.open(event, message);
    });

    this.$eventBus.$on('send-file', args => {
        let fileMessageContent = new FileMessageContent(null, args.remoteUrl, args.name, args.size);
       let message = new Message(null, fileMessageContent);
       this.forward(message)
    })
  },

  beforeDestroy() {
    document.removeEventListener('mouseup', this.dragEnd);
    document.removeEventListener('mousemove', this.drag);
    this.$eventBus.$off('send-file')
  },

  updated() {
    this.popupItem = this.$refs['setting'];
    // refer to http://iamdustan.com/smoothscroll/
    console.log('conversationView updated', this.sharedConversationState.shouldAutoScrollToBottom)
    if (this.sharedConversationState.shouldAutoScrollToBottom) {
      let messageListElement = this.$refs['conversationMessageList'];
      messageListElement.scroll({top: messageListElement.scrollHeight, left: 0, behavior: 'auto'})
    } else {
      // 用户滑动到上面之后，收到新消息，不自动滑动到最下面
    }
    if (this.sharedConversationState.currentConversationInfo) {
      let unreadCount = this.sharedConversationState.currentConversationInfo.unreadCount;
      if (unreadCount.unread > 0) {
        store.clearConversationUnreadStatus(this.sharedConversationState.currentConversationInfo.conversation);
      }
    }

    if (this.conversationInfo && this.sharedConversationState.currentConversationInfo && !this.conversationInfo.conversation.equal(this.sharedConversationState.currentConversationInfo.conversation)) {
      this.showConversationInfo = false;
    }
    this.conversationInfo = this.sharedConversationState.currentConversationInfo;
  },

  computed: {
    conversationTitle() {
      let info = this.sharedConversationState.currentConversationInfo;
      return info.conversation._target._displayName;
    },
    loadingIdentifier() {
      let conversation = this.sharedConversationState.currentConversationInfo.conversation;
      return conversation.type + '-' + conversation.target + '-' + conversation.line;
    }
  },

  directives: {
    ClickOutside
  },
};
</script>

<style lang="css" scoped>
.conversation-empty-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-top-right-radius: var(--main-border-radius);
  border-bottom-right-radius: var(--main-border-radius);
  /*border-left: 1px solid #e6e6e6;*/
}

.conversation-empty-container h1 {
  font-size: 17px;
  font-weight: normal;
}

.title-container {
  width: 100%;
  height: 60px;
  display: flex;
  padding: 0 0 0 20px;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e6e6e6;
  border-top-right-radius: var(--main-border-radius);
  position: relative;
}


.title-container h1 {
  font-size: 16px;
  font-weight: normal;
}

.title-container a {
  text-decoration: none;
  padding: 15px;
  color: #181818;
}

.title-container a:active {
  color: #d6d6d6;
}

.conversation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-container header {
  border-top-right-radius: var(--main-border-radius);
}

.conversation-container header {
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e6e6e6;
}

.conversation-content-container {
  flex: 1;
  height: calc(100% - 60px);
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #f3f3f3;
  border-bottom-right-radius: var(--main-border-radius);
}

.conversation-content-container .drag-drop-container {
  position: absolute;
  background-color: #f2f2f2a5;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  height: 100%;
  padding: 20px 15px 15px 15px;
}

.conversation-content-container .drag-drop {
  border: 2px dashed #b2b2b2;
  height: 100%;
  width: 100%;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.conversation-content-container .drag-drop p {
  padding-bottom: 100px;
}

.conversation-message-list {
  flex: 1 1 auto;
  overflow: auto;
}

.conversation-message-list ul {
  list-style: none;
}

/*.handler {*/
/*  height: 1px;*/
/*  background-color: #e2e2e2;*/
/*}*/

.inputting-container {
  display: flex;
  padding: 10px 20px;
  align-items: center;
}

.inputting-container .avatar {
  width: 40px;
  height: 40px;
  border-radius: 3px;
  margin-right: 20px;
}

.divider-handler::before {
  cursor: row-resize;
  content: '';
  display: block;
  width: 100%;
  height: 3px;
  border-top: 1px solid #e2e2e2;
  margin: 0 auto;
}

.message-input-container {
  height: 200px;
  min-height: 200px;
}

.conversation-info-container {
  display: none;
  width: 250px;
  height: 100%;
  top: 0;
  right: 0;
  position: absolute;
  background-color: #ffffffe5;
  backdrop-filter: blur(6px);
  border-left: 1px solid #e6e6e6;
}

.conversation-info-container.active {
  display: flex;
}
</style>
