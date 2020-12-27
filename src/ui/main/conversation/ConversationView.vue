<template>
  <section>
    <CoolLightBox
        :items="sharedConversationState.previewMediaItems"
        :index="sharedConversationState.previewMediaIndex"
        :slideshow="false"
        @close="sharedConversationState.previewMediaIndex = null">
    </CoolLightBox>
    <div v-if="sharedConversationState.currentConversationInfo == null" class="conversation-empty-container">
      <h1>^~^</h1>
    </div>
    <div v-else class="conversation-container">
      <header>
        <div class="title-container">
          <h1 class="single-line">{{ conversationTitle }}</h1>
          <a href="#"><img ref="setting" @click="toggleConversationInfo" src="" alt="setting"/></a>
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
            <p>拖拽到此发送给{{ conversationTitle }}</p>
          </div>
        </div>
        <div ref="conversationMessageList" class="conversation-message-list" v-on:scroll="onScroll" infinite-wrapper>
          <infinite-loading :identifier="loadingIdentifier" force-use-infinite-wrapper direction="top"
                            @infinite="infiniteHandler"/>
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
        <div v-show="!sharedConversationState.enableMessageMultiSelection" v-on:mousedown="dragStart"
             class="divider-handler"></div>
        <MessageInputView :conversationInfo="sharedConversationState.currentConversationInfo"
                          v-show="!sharedConversationState.enableMessageMultiSelection"
                          class="message-input-container"/>
        <MultiSelectActionView v-show="sharedConversationState.enableMessageMultiSelection"/>
        <SingleConversationInfoView
            v-if="sharedConversationState.currentConversationInfo === 1"
            v-click-outside="hideConversationInfo"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />
        <GroupConversationInfoView
            v-click-outside="hideConversationInfo"
            v-if="sharedConversationState.currentConversationInfo === 2"
            v-bind:class="{ active: showConversationInfo }"
            class="conversation-info-container"
        />

        <vue-context ref="menu" v-slot="{data:message}" :close-on-scroll="true">
          <!--          更多menu item-->
          <li v-if="isCopyable(message)">
            <a @click.prevent="">复制</a>
          </li>
          <li>
            <a @click.prevent="delMessage(message)">删除</a>
          </li>
          <li v-if="isForwardable(message)">
            <a @click.prevent="forward(message)">转发</a>
          </li>
          <li v-if="isFavable">
            <a @click.prevent="">收藏</a>
          </li>
          <li>
            <a @click.prevent="quoteMessage(message)">引用</a>
          </li>
          <li>
            <a @click.prevent="multiSelect">多选</a>
          </li>
          <li v-if="isRecallable(message)">
            <a @click.prevent="recallMessage(message)">撤回</a>
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
import ConversationType from "@/wfc/model/conversationType";
import store from "@/store";
import wfc from "@/wfc/client/wfc";
import {numberValue} from "@/wfc/util/longUtil";
import CoolLightBox from 'vue-cool-lightbox'
import 'vue-cool-lightbox/dist/vue-cool-lightbox.min.css'
import InfiniteLoading from 'vue-infinite-loading';
import MultiSelectActionView from "@/ui/main/conversation/MessageMultiSelectActionView";

export default {
  components: {
    MultiSelectActionView,
    NotificationMessageContentView,
    NormalInMessageContentView,
    NormalOutMessageContentView,
    MessageInputView,
    GroupConversationInfoView,
    SingleConversationInfoView,
    CoolLightBox,
    InfiniteLoading,
  },
  // props: ["conversation"],
  data() {
    return {
      showConversationInfo: false,
      isInviteConversationMember: false,
      isShowConversationMember: false,
      sharedConversationState: store.state.conversation,
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
            store.sendFile(this.sharedConversationState.currentConversationInfo.conversation, e.dataTransfer.files[i]);
          }
        } else {
          // TODO
          // toast
          console.log('一次最多发送5个文件');
        }
      } else if (v === 'dragover') {
        // If not st as 'copy', electron will open the drop file
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    toggleConversationInfo() {
      console.log("toggle conversationInfo");
      this.showConversationInfo = !this.showConversationInfo;
    },

    toggleMessageMultiSelectionActionView() {
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
      this.sharedConversationState.selectedMessages.forEach(m => console.log(m.messageId));
      store.toggleMessageMultiSelection();
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
      console.log('hide conv')
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
      this.$refs.menu.close();

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

    // message context menu
    isCopyable(message) {
      return message && message.messageContent instanceof TextMessageContent;
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

    recallMessage(message) {
      wfc.recallMessage(message.messageUid, null, null);
    },

    delMessage(message) {
      wfc.deleteMessage(message.messageId);
    },

    forward(message) {
      // TODO

    },

    quoteMessage(message) {
      store.quoteMessage(message);
    },
    multiSelect() {
      this.toggleMessageMultiSelectionActionView();
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


  },

  mounted() {
    this.popupItem = this.$refs['setting'];
    document.addEventListener('mouseup', this.dragEnd);
    document.addEventListener('mousemove', this.drag);

    this.$on('openMessageContextMenu', function (event, message) {
      this.$refs.menu.open(event, message);
    });
  },

  unmounted() {
    document.removeEventListener('mouseup', this.dragEnd);
    document.removeEventListener('mousemove', this.drag);

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
      wfc.clearConversationUnreadStatus(this.sharedConversationState.currentConversationInfo.conversation);
    }
  },

  computed: {
    conversationTitle() {
      let info = this.sharedConversationState.currentConversationInfo;
      if (info.conversation.type === ConversationType.Single) {
        return info.conversation._target.displayName;
      } else {
        return info.conversation._target.name;
      }
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

.title-container {
  width: 100%;
  height: 60px;
  display: flex;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e6e6e6;
  border-top-right-radius: var(--main-border-radius);
}

.title-container h1 {
  font-size: 16px;
  font-weight: normal;
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
.conversation-content-container .drag-drop p{
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
  background-color: aquamarine;
}

.conversation-info-container.active {
  display: block;
}
</style>
