/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

import wfc from "./wfc";
import EventType from "./wfcEvent";
import Conversation from "../model/conversation";
import TextMessageContent from "../messages/textMessageContent";

export default class WfcCli {

    // wfc = new WfcManager();

    init() {
        // //remote 138777777777
        var username = 'GNMtGtZZ';
        var clientId = '78E616BC-1F7C-405F-AB16-41539EA89150';
        var token = 'dGx2nKj1jrLdHUt8B7Uwm19v/C0BJbR1tXySfG0Nf7mjpQVZX5Dk2d07UObJxNAzmTs6vVTsVsWMI3TIiCUd6SUKXNjdZHTT6N5NpIrSSKhVc9c60bJxAbmLCIRPVppKIkW0/0Lpx83B8Z0zlGMUrdadO3TUKaoh484yLKwoGac=';
        var host = 'wildfirechat.cn';
        var shortPort = 80;

        // connect(appId, appKey, host, port, userId, clientId, token) {
        wfc.connect('appId', 'appKey', host, shortPort, username, clientId, token)
        wfc.eventEmitter.on(EventType.ConnectionStatusChanged, (status) => {
            vorpal.log('on connect status change', status);
        });

        wfc.eventEmitter.on(EventType.ReceiveMessage, (msg) => {
            vorpal.log('on receive msg', msg);
        });
    }

    getConversationList() {
        return wfc.getConversationList([0, 1, 2, 3], [0, 1]);
    }

}
// test start
// var wfcTest = new WfcTest();
// wfcTest.init();

var vorpal = require('vorpal')();
var wfcCli = new WfcCli();


vorpal
    .command('init', 'init')
    .action(function (args, callback) {
        wfcCli.init();
        callback();
    });

// 会话列表
vorpal
    .command('getConversationList', 'get conversation list')
    .action(function (args, callback) {
        this.log(wfcCli.getConversationList());
        callback();
    });

// 删除会话
vorpal
    .command('deleteConversation <type> <target> <line>', 'delete conversation')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        wfcCli.wfc.removeConversation(conv);
        callback();
    });

// 会话置顶 
vorpal
    .command('setConversationTop <type> <target> <line> <isTop>', 'set conversation top')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        wfcCli.wfc.setConversationTop(conv, args.isTop, () => {
            this.log('set conversation top success');
        }, (errorCode) => {
            this.log('set conversation top error', errorCode);
        });
        callback();
    });

// 会话免打扰
vorpal
    .command('setConversationSilent <type> <target> <line> <isSilent>', 'set conversation silent')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        wfcCli.wfc.setConversationTop(conv, args.isSilent, () => {
            this.log('set conversation silent success');
        }, (errorCode) => {
            this.log('set conversation silent error', errorCode);
        });
        callback();
    });

// 搜索会话
vorpal
    .command('searchConversation <keyword> [type] [line]', 'search conversation')
    .action(function (args, callback) {
        this.log('search args', args);
        let result = wfcCli.wfc.searchConversation(args.keyword, [args.type], [args.line]);
        this.log('search reuslt', result);
        callback();
    });

// 所有会话未读数
vorpal
    .command('getUnreadCount', 'get unread count')
    .action(function (args, callback) {
        let result = wfcCli.wfc.getUnreadCount();
        this.log('get unread count reuslt', result);
        callback();
    });


// 会话
// 会话详情
vorpal
    .command('getConversationInfo <type> <target> <line>', 'get conversation info')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let result = wfcCli.wfc.getConversationInfo(conv);
        this.log('get unread count reuslt', result);
        callback();
    });

// 发送消息
vorpal
    .command('sendMessage <type> <target> <line>', 'get conversation info')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let txtMsgContent = new TextMessageContent('txt message content');
        let result = wfcCli.wfc.sendConversationMessage(conv, txtMsgContent);
        this.log('get unread count reuslt', result);
        callback();
    });

// 会话未读数
vorpal
    .command('geConversationUnreadCount <type> <target> <line>', 'get conversation unread count')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let result = wfcCli.wfc.getConversationUnreadCount(conv);
        this.log('get conversation unread count reuslt', result);
        callback();
    });

// 清空会话消息未读状态
vorpal
    .command('clearConversationUnreadStatus <type> <target> <line>', 'clear conversation unread status')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let result = wfcCli.wfc.clearConversationUnreadStatus(conv);
        this.log('get conversation unread count reuslt', result);
        callback();
    });

// 会话消息列表
vorpal
    .command('getConversationMessages <type> <target> <line>', 'get conversation messages')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let result = wfcCli.wfc.getMessages(conv);
        this.log('get conversation unread count reuslt', result);
        callback();
    });

// 清空会话
vorpal
    .command('clearConversation <type> <target> <line>', 'clear conversation')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let result = wfcCli.wfc.clearMessages(conv);
        this.log('clearConversation reuslt', result);
        callback();
    });

// 删除消息
vorpal
    .command('deleteMessage <messageId>', 'delete message by messageId')
    .action(function (args, callback) {
        let result = wfcCli.wfc.deleteMessage(args.messageId);
        this.log('delete message reuslt', result);
        callback();
    });

// 搜索消息
vorpal
    .command('searchMessage <keyword>', 'search message')
    .action(function (args, callback) {
        let result = wfcCli.wfc.searchMessage(rgs.keyword);
        this.log('search message reuslt', result);
        callback();
    });

// 搜索会话消息
vorpal
    .command('searchConversationMessage <type> <target> <line> <keyword>', 'search conversation message')
    .action(function (args, callback) {
        let conv = new Conversation(args.type, args.target, args.line);
        let result = wfcCli.wfc.searchMessage(conv, args.keyword);
        this.log('search conversation message reuslt', result);
        callback();
    });

vorpal
    .delimiter('wfc$')
    .show();
