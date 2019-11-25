var Discord = require('discord.js');
const { prefix } = require('./config.json');
var fs = require('fs');
var cron = require('cron');
require('dotenv').config();

const Client = new Discord.Client();

Client.userJSON = require('./user.json');
Client.cardJSON = require('./card.json');
Client.codeJSON = require('./code.json');
Client.auctionJSON = require('./auction.json');

Client.on('ready', () => {
    console.log(`Logged in as ${Client.user.tag}!`);

    Client.user.setGame("SamumuBot!");
});

Client.once('ready', () => {
    console.log('Ready!');
});



//============================================================================================================================
//bot command
var index;
const userInfo = "userInfo";
const cardInfo = "cardInfo";
const codeInfo = "codeInfo";
const auctionInfo = "auctionInfo";
const slotPlointConsume = -100;
const checkinPoints = 200;

//write user id to userinfo.json
//display every message
Client.on('message', message => {
    console.log(message.content);
    if (message.author.username != "Santa Claus") {
        inputUserID(message.author.username, message.author.id)
    }
});
//$help
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}help`)) {
        message.channel.send('命令列表\n$checkin：每日登入領取 200 點' +
            '\n$info：查看個人資訊\n$card：查看卡片資訊\n$slot：花費 100 點數抽獎\n$rank：查看積分排行榜'
            + '\n$exchange 100：兌換 100 點數為 10 積分\n$code xxx：輸入序號兌換積分\n$sell hello：販賣已擁有卡片 hello'
            + '\n$bid hello 100：參加拍賣會，對 hello 出價 100 點數，時限內價高者得');
    }
})

//$checkin
//checkin reset at 9 am everyday
let checkinResetCron = new cron.CronJob('00 00 09 * * *', checkinReset);
checkinResetCron.start();

Client.on('message', message => {
    if (message.content.startsWith(`${prefix}checkin`)) {

        for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
            if (message.author.id == Client.userJSON[userInfo][i].userID) {
                if (Client.userJSON[userInfo][i].checkin == "off") {
                    console.log(message.author.id);
                    Client.userJSON[userInfo][i].checkin = "on";
                    writeJSON(Client.userJSON);
                    Client.userJSON[userInfo][i].points = Client.userJSON[userInfo][i].points + checkinPoints;
                    writeJSON(Client.userJSON);
                    message.channel.send('恭喜 ' + message.author.username + '獲得 ' + checkinPoints +
                        ' 點數！\n目前共有：' + Client.userJSON[userInfo][i].points + '點數');
                } else if (Client.userJSON[userInfo][i].checkin == "on") {
                    message.channel.send(message.author.username + "今天已經完成 Checkin！:eyes:\n每早 9 點重置");
                }
            }
        }
    }
});


//>info
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}info`)) {

        index = changeUserIDToIndex(message.author.id, index);

        message.channel.send(message.author.username + ' 資訊\nID：'
            + message.author.id + '\n點數：'
            + Client.userJSON[userInfo][index].points + ' 點\n積分：'
            + Client.userJSON[userInfo][index].erc + ' 分\n');

    }
})
//>card
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}card`)) {

        var cardInfoArray = [];
        var noCardInfoArray = [];

        for (var index = 0; index < Client.userJSON[userInfo].length; index++) {
            if (message.author.id == Client.userJSON[userInfo][index].userID) {
                for (var i = 0; i < Client.userJSON[userInfo][index].userCard.length; i++) {
                    if (Client.userJSON[userInfo][index].userCard[i].cardStatus == "on") {
                        cardInfoArray.push('【' + Client.cardJSON[cardInfo][i].name + '】\n卡片效果：' + Client.cardJSON[cardInfo][i].ability + '\n');
                        console.log(cardInfoArray);
                    } else if (Client.userJSON[userInfo][index].userCard[i].cardStatus == "off") {
                        noCardInfoArray.push('【' + Client.cardJSON[cardInfo][i].name + '】\n卡片效果：' + Client.cardJSON[cardInfo][i].ability + '\n');
                        console.log(noCardInfoArray);
                    }
                }
            }
        }
        cardInfoArray = cardInfoArray.join('');
        noCardInfoArray = noCardInfoArray.join('');

        message.channel.send(message.author.username + ' 的卡片資訊\n擁有卡片：\n' + cardInfoArray
            + '\n尚未擁有卡片：\n' + noCardInfoArray);
        /*
        for (var i = 0; i < cardInfoArray.length; i++) {
            message.channel.send(cardInfoArray[i]);
        }
        */
        /*
        for (var i = 0; i < noCardInfoArray.length; i++) {
            message.channel.send(noCardInfoArray[i]);
        }
        */
    }
})
//>slot
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}slot`)) {
        var slotPrize;
        message.channel.send(message.author.username + ' 開始抽獎');

        //index = changeUserIDToIndex(message.author.id, index);
        for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
            if (message.author.id == Client.userJSON[userInfo][i].userID) {
                if (Client.userJSON.userInfo[i].points + slotPlointConsume < 0) {
                    message.channel.send(message.author.username + ' 點數不足無法抽獎！')
                } else {
                    slotPrize = slot(message.author.id, slotPrize);
                    message.channel.send(message.author.username + ' 消耗 ' + (-slotPlointConsume) + ' 點...\n' + slotPrize
                        + ' \n剩餘點數 ' + Client.userJSON[userInfo][i].points + ' 點');
                }
            }
        }
    }
})
//>rank
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}rank`)) {

        var rankArray = [];
        var rankDisplay = [];
        message.channel.send('積分排行榜')
        rankArray = rankErc(rankArray);
        for (var i = 0; i < rankArray[1].length; i++) {
            if (rankArray[1][i] != rankArray[1][i + 1]) {
                rankDisplay.push('第 ' + (i + 1) + ' 名： ' + rankArray[1][i] +
                    ' 共 ' + rankArray[0][i] + ' 分\n');
            } else {
                for (var j = 0; j < (rankArray[0].length - i); j++) {
                    if (rankArray[0][i] == rankArray[0][i + j] && rankArray[0][i] != undefined) {
                        rankDisplay.push('第 ' + (i + 1) + ' 名： ' + rankArray[1][i + j] +
                            ' 共 ' + rankArray[0][i + j] + ' 分\n');
                    }
                }

            }

        }
        message.channel.send(rankDisplay);
        /*
        message.channel.send('第一名：' + rankArray[1][rankArray[1].length - 1] +
            ' 共 ' + rankArray[0][rankArray[0].length - 1] +
            ' 分\n第二名：' + rankArray[1][rankArray[1].length - 2] +
            ' 共 ' + rankArray[0][rankArray[0].length - 2] + ' 分');
        */
    }
})
//>exchange
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}exchange`)) {
        var _;
        var point;
        _, point = message.content.split(' ', 2)
        var exchangePoints = parseInt(point[1], 10);
        var exchangeErc = parseFloat((exchangePoints * 0.1).toFixed(1));

        if (exchangePoints == undefined) {
            message.channel.send('格式錯誤，請輸入 $help 查看用法');
        } else {
            for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
                if (message.author.id == Client.userJSON[userInfo][i].userID) {
                    if (Client.userJSON[userInfo][i].points - exchangePoints > 0) {
                        Client.userJSON[userInfo][i].points -= exchangePoints;
                        Client.userJSON[userInfo][i].erc += exchangeErc;
                        writeJSON(Client.userJSON);
                        message.channel.send('花費 ' + exchangePoints + ' 點數兌換 ' + exchangeErc + ' 積分!');
                    } else {
                        message.channel.send('點數不足無法兌換！')
                    }
                }
            }
        }

    }
})

//>code
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}code`)) {
        var _;
        var getErcCode;
        var code;
        var codeResult;
        _, getErcCode = message.content.split(' ', 2);
        code = getErcCode[1];
        console.log(code);
        codeResult = getErcFromPrivateKey(message.author.id, code, codeResult);
        message.channel.send(codeResult);
    }
})

//>sell
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}sell`)) {
        var _;
        var getSellCard;
        var cardName;
        var cardIndex;

        _, getSellCard = message.content.split(' ', 2);
        cardName = getSellCard[1];
        cardIndex = getSellCardIndex(cardName)
        //console.log(cardIndex);
        if (cardIndex == undefined) {
            message.channel.send('卡片名稱輸入錯誤，請輸入 $card 確認');
        } else {

            if (canSell(message.author.id, cardIndex)) {
                console.log('can sell ' + cardName);
                changeSelling(cardIndex, "true", message.author.username);
                message.channel.send(message.author.username + ' 正在出售卡片：' + cardName + '\n有興趣的買家請儘速出價，出價時間為 10 分鐘！！');
                var sellTimeInterval = setTimeout(function () {
                    //highestBidPoint = getHighestPoint();
                    changeSelling(cardIndex, "false", message.author.username);
                    var bidder = Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray[Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray.length - 1];
                    var bidPoint = parseInt(Client.auctionJSON[auctionInfo][cardIndex].bidArray.priceArray[Client.auctionJSON[auctionInfo][cardIndex].bidArray.priceArray.length - 1]);
                    winningBidderGetCard(bidder, cardIndex, bidPoint);

                    if (bidder == message.author.username) {
                        message.channel.send(cardName + " 的拍賣會已經結束，無人競拍，卡片歸還原主");
                    } else {
                        message.channel.send(cardName + " 的拍賣已經結束，由 "
                            + Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray[Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray.length - 1]
                            + " 以 " + Client.auctionJSON[auctionInfo][cardIndex].bidArray.priceArray[Client.auctionJSON[auctionInfo][cardIndex].bidArray.priceArray.length - 1]
                            + " 點數得標 ").catch(console.error);
                    }
                }, 10 * 60 * 1000);

            } else if (!canSell(message.author.id, cardIndex)) {
                message.channel.send("尚未擁有該卡片，無法出售 " + cardName);
            } else {
                message.channel.send("格式錯誤，請輸入：$help 來查看詳細用法");
            }
        }
    }
})

//>bid
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}bid`)) {
        var _;
        var getBidCard;
        var cardName;
        var cardIndex;
        var userIndex;
        var bidPrice;
        var bidPriceArray = [];
        var bidUsernameArray = [];
        var bidResultDisplay = [];

        _, getBidCard = message.content.split(' ', 3);
        cardName = getBidCard[1];
        bidPrice = parseInt(getBidCard[2], 10);
        cardIndex = getSellCardIndex(cardName)
        userIndex = changeUserIDToIndex(message.author.id);
        console.log(cardIndex);

        if (cardIndex == undefined || bidPrice == undefined) {
            bidResultDisplay.push("格式錯誤，請輸入：$help 來查看詳細用法");
        } else {
            if (bidPrice <= Client.userJSON[userInfo][userIndex].points) {
                bidPriceArray = Client.auctionJSON[auctionInfo][cardIndex].bidArray.priceArray;
                //console.log(bidPriceArray);
                bidUsernameArray = Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray;
                if (bidPriceArray == [] || bidPrice > bidPriceArray[bidPriceArray.length - 1]) {
                    if (message.author.username != Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray[0]) {
                        bidToAuctionJSON(message.author.username, bidPrice, bidPriceArray, bidUsernameArray);
                        bidResultDisplay.push(message.author.username + '成功出價！\n出價 ' + bidPrice + ' 點數，為目前最高價！');
                    } else {
                        bidResultDisplay.push("禁止哄抬物價，謝謝配合！");
                    }
                } else if (bidPrice <= bidPriceArray[bidPriceArray.length - 1]) {
                    bidResultDisplay.push(message.author.username + '出價失敗！！\n目前最高出價為 '
                        + bidUsernameArray[bidUsernameArray.length - 1] + ' 的 ' + bidPriceArray[bidPriceArray.length - 1]
                        + ' 點，有興趣的買家請出高價競標！');
                }
            } else {
                bidResultDisplay.push(message.author.username + ' 點數不足，無法出價！');
            }
            console.log(bidResultDisplay);
        }

        if (cardIndex == undefined || bidPrice == undefined) {
            message.channel.send("格式錯誤，請輸入：$help 來查看詳細用法");
        } else {
            if (canBid(cardIndex)) {
                message.channel.send(bidResultDisplay);
            } else if (!canBid(cardIndex)) {
                message.channel.send("尚未有人出售該卡片，無法出價！");
            } else if (canBid(cardIndex == undefined)) {
                message.channel.send("格式錯誤，請輸入：$help 來查看詳細用法");
            }
        }
    }
})

/*
============================================================================================================================
Main Function
*/

function DisplayRules(helpDisplay) {
    //if someone new enter the server display rules on channels
}

function writeJSON(json) {
    fs.writeFile('./userInfo.json', JSON.stringify(json, null, 4), err => {
        if (err) throw err;
    })
}


function inputUserID(userName, id) {

    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (userName == Client.userJSON[userInfo][i].username) {
            Client.userJSON[userInfo][i].userID = parseInt(id);
            console.log("Parse userID");
            break;
        } else if (Client.userJSON[userInfo][i].username == "test") {
            Client.userJSON[userInfo][i].username = userName;
            Client.userJSON[userInfo][i].userID = parseInt(id);
            break;
        }
    }
    writeJSON(Client.userJSON);
}

function checkinReset() {
    console.log("checkinReset at 9 am everyday");
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        Client.userJSON[userInfo][i].checkin = "false";
        console.log('Reset checkin ' + Client.userJSON[userInfo][i].username);
    }
}


/*
function changePoints(id, point) {
    //先將原本的 json 檔讀出來
    fs.readFile('./userInfo.json', function (err, userInfo) {
        if (err) {
            return console.error(err);
        }
        var user = userInfo.toString();//將二進制數據轉換為字串符
        user = JSON.parse(user);//將字符串轉換成JSON對象

        //將數據讀出來並修改指定部分，在這邊我是修改 id 最大的用戶的資料
        for (var i = 0; i < user.userInfo.length; i++) {
            if (id == user.userInfo[i].userID) {
                if (user.userInfo[i].points + point > 0) {
                    user.userInfo[i].points = user.userInfo[i].points + point;
                }
            }
        }
        var str = JSON.stringify(user);//因為寫入文件（json）只認識字符串或二進制數，所以需要將json對象轉換成字符串

        //最後再將數據寫入
        fs.writeFile('./userInfo.json', str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log('Change points in userInfo.json...');
        })
    })
}

function changeErc(id, erc) {
    //先將原本的 json 檔讀出來
    fs.readFile('./userInfo.json', function (err, userInfo) {
        if (err) {
            return console.error(err);
        }
        var user = userInfo.toString();//將二進制數據轉換為字串符
        user = JSON.parse(user);//將字符串轉換成JSON對象

        for (var i = 0; i < user.userInfo.length; i++) {
            if (id == user.userInfo[i].userID) {
                user.userInfo[i].erc = user.userInfo[i].erc + erc;
                console.log(user.userInfo[i].erc);
            }
        }
        var str = JSON.stringify(user);//因為寫入文件（json）只認識字符串或二進制數，所以需要將json對象轉換成字符串

        //最後再將數據寫入
        fs.writeFile('./userInfo.json', str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log('Add erc');
        })
    })
}
*/

function changeUserIDToIndex(id, index) {
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (id == Client.userJSON[userInfo][i].userID) {
            index = i;
        }
    }
    return index;
}



function rankErc(rankArray) {
    var ercArray = [];
    var topErcArray = [];
    var topNameArray = [];
    for (i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (Client.userJSON[userInfo][i].username != "test") {
            ercArray.push(Client.userJSON[userInfo][i].erc);
        }
    }
    //sort erc array
    ercArray = bubbleSort(ercArray);
    console.log('ercArray:' + ercArray);

    //only display Top10
    if (ercArray.length < 10) {
        for (var i = 1; i <= ercArray.length; i++) {
            topErcArray.push(ercArray[ercArray.length - i]);
        }
    } else if (ercArray.length >= 10) {
        for (var i = 1; i <= 10; i++) {
            topErcArray.push(ercArray[ercArray.length - i]);
        }
    }
    console.log(topErcArray);


    //infer name array
    for (var i = 0; i < topErcArray.length; i++) {
        for (var j = 0; j < Client.userJSON[userInfo].length; j++) {
            if (topErcArray[i] == Client.userJSON[userInfo][j].erc) {
                //console.log('same erc');
                //sort name array
                if (topNameArray.length == 0) {
                    topNameArray.push(Client.userJSON[userInfo][j].username);
                    console.log('if topNameArray = []');
                } else {
                    if (topNameArray[0] != undefined) {
                        topNameArray.push(Client.userJSON[userInfo][j].username);
                    }
                }
            }
        }
    }
    console.log('topNameArray' + topNameArray);


    for (var i = 0; i < 2; i++) {
        rankArray[i] = [];
        for (var j = 0; j < topErcArray.length; j++) {
            if (i == 0) {
                rankArray[i][j] = topErcArray[j];
            } else if (i == 1) {
                rankArray[i][j] = topNameArray[j];
            }
        }
    }
    console.log(rankArray);
    return rankArray;
}

function slot(id, slotPrize) {
    var slotPoint = GetRandomNum(1, 200);
    var slotCard = GetRandomNum(1, 10);
    var random = GetRandomNum(0, 1);
    for (var index = 0; index < Client.userJSON[userInfo].length; index++) {
        if (id == Client.userJSON[userInfo][index].userID) {
            if (random == 0) {
                Client.userJSON[userInfo][index].points = Client.userJSON[userInfo][index].points + slotPoint + slotPlointConsume;
                slotPrize = '恭喜獲得' + slotPoint + ' 點！';
            } else if (random == 1) {
                slotPrize = '恭喜獲得' + slotCard + ' 號卡片！';
                var cardIndex = slotCard - 1;
                Client.userJSON[userInfo][index].points = Client.userJSON[userInfo][index].points + slotPlointConsume;
                Client.userJSON[userInfo][index].userCard[cardIndex].cardStatus = "on";
            }
            console.log(Client.userJSON[userInfo][index].userCard)
            writeJSON(Client.userJSON);
        }
    }
    return slotPrize;
}


function getErcFromPrivateKey(id, code, result) {

    var getErc;
    for (var i = 0; i < Client.codeJSON[codeInfo].length; i++) {
        if (code == Client.codeJSON[codeInfo][i].privateKey) {
            if (Client.codeJSON[codeInfo][i].status == "on") {
                getErc = Client.codeJSON[codeInfo][i].erc;
                Client.codeJSON[codeInfo][i].status = "off";
                writeJSON(Client.codeJSON);
                for (var j = 0; j < Client.userJSON[userInfo].length; j++) {
                    if (id == Client.userJSON[userInfo][j].userID) {
                        Client.userJSON[userInfo][j].erc += getErc
                        writeJSON(Client.userJSON);
                    }
                }
                result = "積分兌換成功！！\n恭喜獲得 " + getErc + " 積分";

            } else if (Client.codeJSON[codeInfo][i].status == "off") {
                result = "序號已經被兌換！！\n若有問題，請聯繫客服！";
            }
        }
    }
    if (result == undefined) {
        result = "序號輸入錯誤，請重新輸入";
    }
    return result;
}
/*
function changeCard(id, cardsIndex) {
    for (var i = 0; i < bot.userJSON[userInfo].length; i++) {
        if (id == bot.userJSON[userInfo][i].userID) {
            bot.userJSON[userInfo][i].cards[cardsIndex].cardStatus = "on";
        }
    }
}
*/

function getSellCardIndex(cardName) {
    for (var i = 0; i < Client.cardJSON[cardInfo].length; i++) {
        if (cardName == Client.cardJSON[cardInfo][i].name) {
            return i;
        }
    }
}
function canSell(id, cardIndex) {
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (id == Client.userJSON[userInfo][i].userID) {
            if (Client.userJSON[userInfo][i].userCard[cardIndex].cardStatus == "on" &&
                Client.auctionJSON[auctionInfo][cardIndex].inAuction == "false") {
                return true;
            } else {
                return false;
            }
        }
    }
}
function changeSelling(cardIndex, status, sellCardUsername) {

    Client.auctionJSON[auctionInfo][cardIndex].inAuction = status;
    console.log(Client.auctionJSON[auctionInfo][cardIndex].inAuction);
    Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray[0] = sellCardUsername;
    console.log(Client.auctionJSON[auctionInfo][cardIndex].bidArray.usernameArray);

    writeJSON(Client.auctionJSON);
}

function winningBidderGetCard(username, cardIndex, bidPoint) {
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (Client.userJSON[userInfo][i].username == username) {
            Client.userJSON[userInfo][i].userCard[cardIndex].cardStatus = "on";
            Client.userJSON[userInfo][i].points -= bidPoint;
        }
    }
    writeJSON(Client.userJSON);

}

function canBid(cardIndex) {
    if (Client.auctionJSON[auctionInfo][cardIndex].inAuction == "true") {
        return true;
    } else if (Client.auctionJSON[auctionInfo][cardIndex].inAuction == "false") {
        return false;
    } else {
        return undefined;
    }
}

function bidToAuctionJSON(bidUsername, bidPrice, bidPriceArray, bidUsernameArray) {

    bidPrice = parseInt(bidPrice);
    bidPriceArray.push(bidPrice);
    console.log(bidPriceArray);

    bidUsernameArray.push(bidUsername);
    console.log(bidUsernameArray);

    writeJSON(Client.auctionJSON);

}


/*
============================================================================================================================
*/
function GetRandomNum(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}

function bubbleSort(array) {

    for (var i = 0; i < array.length; i++) {
        // 從第一個元素開始，不斷跑到第 n - 1 - i 個
        // 原本是 n - 1，會再加上 - i 是因為最後 i 個元素已經排好了
        // 所以沒必要跟那些排好的元素比較
        for (var j = 0; j < array.length - (i + 1); j++) {
            if (array[j] > array[j + 1]) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
            }
        }
    }
    return array;
}

Client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
