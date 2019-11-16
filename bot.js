var Discord = require('discord.js');
const { prefix } = require('./config.json');
var fs = require('fs');
require('dotenv').config();

const Client = new Discord.Client();

Client.userJSON = require('./user.json');
Client.cardJSON = require('./card.json');
Client.codeJSON = require('./code.json');
Client.on('ready', () => {
    console.log(`Logged in as ${Client.user.tag}!`);

    Client.user.setGame("SamumuBot!");
});

Client.once('ready', () => {
    console.log('Ready!');
});

process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
    process.exit(1) // To exit with a 'failure' code
});

//============================================================================================================================
//bot command
var index;
const userInfo = "userInfo";
const cardInfo = "cardInfo";
const codeInfo = "codeInfo";
const slotPlointConsume = -100;

//write user id to userinfo.json
//display every message
Client.on('message', message => {
    console.log(message.content);
    inputUserID(message.author.username, message.author.id)
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

//>checkin
Client.on('message', message => {
    if (message.content.startsWith(`${prefix}checkin`)) {
        var checkinPoints = 200;
        //console.log(bot.userJSON[userInfo][0].userID)
        for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
            if (message.author.id == Client.userJSON[userInfo][i].userID) {
                if (Client.userJSON[userInfo][i].checkin == "off") {
                    //checkinJSON(message.author.id);
                    Client.userJSON[userInfo][i].checkin = "on";
                    writeJSON(Client.userJSON);
                    Client.userJSON[userInfo][i].points = Client.userJSON[userInfo][i].points + checkinPoints;
                    //changePoints(message.author.id, checkinPoints);
                    message.channel.send('恭喜 ' + message.author.username + '獲得 ' + checkinPoints +
                        ' 點數！\n目前共有：' + Client.userJSON[userInfo][i].points + '點數');
                } else if (Client.userJSON[userInfo][i].checkin == "on") {
                    message.channel.send(message.author.username + "今天已經完成 Checkin！:eyes:");
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
                        cardInfoArray.push(Client.cardJSON[cardInfo][i].name + '\n卡片效果：' + Client.cardJSON[cardInfo][i].ability + '\n');
                        console.log(cardInfoArray);
                    } else if (Client.userJSON[userInfo][index].userCard[i].cardStatus == "off") {
                        noCardInfoArray.push(Client.cardJSON[cardInfo][i].name + '\n卡片效果：' + Client.cardJSON[cardInfo][i].ability + '\n');
                        console.log(noCardInfoArray);
                    }
                }
            }
        }
        cardInfoArray = cardInfoArray.join('');
        noCardInfoArray = noCardInfoArray.join('');

        message.channel.send(message.author.username + ' 的卡片資訊\n擁有卡片：\n' + cardInfoArray);
        /*
        for (var i = 0; i < cardInfoArray.length; i++) {
            message.channel.send(cardInfoArray[i]);
        }
        */
        message.channel.send('尚未擁有卡片：\n' + noCardInfoArray);
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
        message.channel.send('開始抽獎')
        message.channel.send('.');

        //index = changeUserIDToIndex(message.author.id, index);
        for (var index = 0; index < Client.userJSON[userInfo].length; index++) {
            if (message.author.id == Client.userJSON[userInfo][index].userID) {
                if (Client.userJSON.userInfo[index].points + slotPlointConsume < 0) {
                    message.channel.send('點數不足無法抽獎！')
                } else {
                    setTimeout(writeJSON, 3000);
                    message.channel.send('...');
                    slotPrize = slot(message.author.id, slotPrize)
                    message.channel.send('消耗 ' + (-slotPlointConsume) + ' 點...\n' + slotPrize);
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
        for (var i = 1; i <= rankArray[1].length; i++) {
            rankDisplay.push('第 ' + i + ' 名： ' + rankArray[1][rankArray[1].length - i] +
                ' 共 ' + rankArray[0][rankArray[0].length - i] + ' 分\n');
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
        if (canSell(message.author.id, cardIndex)) {
            changeSelling(message.author.id, cardIndex);
            message.channel.send(message.author.username + ' 正在出售卡片：' + cardName + '\n有興趣的買家請儘速出價！！');
        } else if (!canSell(message.author.id, cardIndex)) {
            message.channel.send("尚未擁有該卡片，無法出售 " + cardName);
        } else {
            message.channel.send("格式錯誤，請輸入：$help 來查看詳細用法");
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
        var bidPrice;
        _, getBidCard = message.content.split(' ', 3);
        cardName = getBidCard[1];
        console.log(cardName);
        bidPrice = parseInt(getBidCard[2], 10);
        cardIndex = getSellCardIndex(cardName)
        if (canBid(message.author.id, cardIndex)) {
            message.channel.send(message.author.username + ' 成功出價！\n出價：' + bidPrice + ' 點');
        } else if (!canBid(message.author.id, cardIndex)) {
            message.channel.send("尚未有人出售該卡片，無法出價！");
        } else {
            message.channel.send("格式錯誤，請輸入：$help 來查看詳細用法");
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
        } else if (userName == "test") {
            Client.userJSON[userInfo][i].username = userName;
            Client.userJSON[userInfo][i].userID = parseInt(id);
            break;
        }
    }
    writeJSON(Client.userJSON);
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
    var nameArray = [];
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        ercArray.push(Client.userJSON[userInfo][i].erc);
    }
    ercArray = bubbleSort(ercArray);

    for (var i = 0; i < ercArray.length; i++) {
        for (var j = 0; j < Client.userJSON[userInfo].length; j++) {
            if (ercArray[i] == Client.userJSON[userInfo][j].erc) {
                nameArray.push(Client.userJSON[userInfo][j].username);
                break;
            }
        }
    }
    console.log(nameArray);
    for (var i = 0; i < 2; i++) {
        rankArray[i] = [];
        for (var j = 0; j < ercArray.length; j++) {
            if (i == 0) {
                rankArray[i][j] = ercArray[j];
            } else if (i == 1) {
                rankArray[i][j] = nameArray[j];
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
                writeJSON(bot.codeJSON);
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
            if (Client.userJSON[userInfo][i].userCard[cardIndex].cardStatus == "on") {
                return true;
            } else {
                return false;
            }
        }
    }
}
function changeSelling(id, cardIndex) {
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (id == Client.userJSON[userInfo][i].userID) {
            Client.userJSON[userInfo][i].userCard[cardIndex].selling = "on";
        }
    }
    writeJSON(Client.userJSON);
}

function canBid(id, cardIndex) {
    for (var i = 0; i < Client.userJSON[userInfo].length; i++) {
        if (id == Client.userJSON[userInfo][i].userID) {
            if (Client.userJSON[userInfo][i].userCard[cardIndex].selling == "on") {
                return true;
            } else {
                return false;
            }
        }
    }
}


/*
============================================================================================================================
//userful function
*/
function GetRandomNum(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}

function bubbleSort(array) {
    const n = array.length;
    // 一共要跑 n 輪
    for (var i = 0; i < n; i++) {
        // 從第一個元素開始，不斷跑到第 n - 1 - i 個
        // 原本是 n - 1，會再加上 - i 是因為最後 i 個元素已經排好了
        // 所以沒必要跟那些排好的元素比較
        for (var j = 0; j < n - 1 - i; j++) {
            if (array[j] > array[j + 1]) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
            }
        }
    }
    return array;
}
Client.login(process.env.BOT_TOKEN);//BOT_TOKEN is the Client Secret
