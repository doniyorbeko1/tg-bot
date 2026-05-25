const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

// ======================
// ENV CHECK
// ======================
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminId = process.env.ADMIN_ID;

console.log("BOT STARTING...");
console.log("TOKEN EXISTS:", !!token);
console.log("ADMIN_ID:", adminId);

if (!token) {
    throw new Error("❌ TELEGRAM_BOT_TOKEN is missing in environment variables!");
}

if (!adminId) {
    throw new Error("❌ ADMIN_ID is missing in environment variables!");
}

// ======================
// BOT INIT
// ======================
const bot = new TelegramBot(token, {
    polling: true
});

bot.on("polling_error", (error) => {
    console.log("❌ POLLING ERROR:", error?.response?.body || error.message);
});

// ======================
// EXPRESS SERVER
// ======================
app.get("/", (req, res) => {
    res.send("Bot ishlayapti");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

// ======================
// DATA
// ======================
const cards = [
    {
        number: '6262 5700 7941 9950',
        owner: 'Ganiyev G'
    },
];

const userStates = {};

// ======================
// MENU
// ======================
function mainMenu(chatId) {
    bot.sendMessage(chatId,
        'Kerakli bo‘limni tanlang:',
        {
            reply_markup: {
                keyboard: [
                    ['💳 Hisobni to‘ldirish'],
                    ['💸 Pul yechish'],
                    ['🛠 Support']
                ],
                resize_keyboard: true
            }
        }
    );
}

// ======================
// START
// ======================
bot.onText(/\/start/, (msg) => {
    userStates[msg.chat.id] = {};

    bot.sendMessage(msg.chat.id, 'Assalomu alaykum!');
    mainMenu(msg.chat.id);
});

// ======================
// MESSAGE HANDLER
// ======================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    if (text === '/start') return;

    if (chatId == adminId) return;

    if (!userStates[chatId]) {
        userStates[chatId] = {};
    }

    const state = userStates[chatId];

    // ======================
    // MAIN MENU
    // ======================
    if (text === '💳 Hisobni to‘ldirish') {
        state.step = 'deposit_id';

        return bot.sendMessage(chatId,
`1xBet ID yuboring.`
        );
    }

    if (text === '💸 Pul yechish') {
        state.step = 'withdraw_screenshot';

        return bot.sendMessage(chatId,
`Screenshot yuboring.`
        );
    }

    if (text === '🛠 Support') {
        state.step = 'support';

        return bot.sendMessage(chatId,
`Xabaringizni yozing.`
        );
    }

    if (text === '🔙 Asosiy menyu') {
        userStates[chatId] = {};
        return mainMenu(chatId);
    }

    if (text === '📞 Operator kontakti') {
        return bot.sendMessage(chatId, 'Operator: @Kassa_1xbt');
    }

    // ======================
    // DEPOSIT FLOW
    // ======================
    if (state.step === 'deposit_id') {
        state.betId = text;
        state.step = 'deposit_amount';

        return bot.sendMessage(chatId, 'Summani kiriting.');
    }

    if (state.step === 'deposit_amount') {
        state.amount = text;
        state.step = 'deposit_screenshot';

        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        state.card = randomCard;

        return bot.sendMessage(chatId,
`💳 ${randomCard.number}
👤 ${randomCard.owner}

Screenshot yuboring.`
        );
    }

    if (state.step === 'deposit_screenshot') {
        if (!msg.photo) {
            return bot.sendMessage(chatId, 'Screenshot yuboring.');
        }

        const photoId = msg.photo[msg.photo.length - 1].file_id;

        bot.sendPhoto(adminId, photoId, {
            caption:
`📥 Deposit

👤 ${msg.from.first_name}
🆔 ${chatId}

ID: ${state.betId}
Summa: ${state.amount}
Karta: ${state.card.number}`,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ OK', callback_data: `approveDeposit_${chatId}` },
                        { text: '❌ NO', callback_data: `rejectDeposit_${chatId}` }
                    ]
                ]
            }
        });

        userStates[chatId] = {};

        return bot.sendMessage(chatId, '⏳ Qabul qilindi');
    }

    // ======================
    // WITHDRAW FLOW
    // ======================
    if (state.step === 'withdraw_screenshot') {
        if (!msg.photo) {
            return bot.sendMessage(chatId, 'Screenshot yuboring.');
        }

        state.withdrawPhoto = msg.photo[msg.photo.length - 1].file_id;
        state.step = 'withdraw_card';

        return bot.sendMessage(chatId, 'Karta raqam yuboring.');
    }

    if (state.step === 'withdraw_card') {
        state.cardNumber = text;

        bot.sendPhoto(adminId, state.withdrawPhoto, {
            caption:
`💸 Withdraw

👤 ${msg.from.first_name}
🆔 ${chatId}

💳 ${state.cardNumber}`,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Paid', callback_data: `approveWithdraw_${chatId}` },
                        { text: '❌ Cancel', callback_data: `rejectWithdraw_${chatId}` }
                    ]
                ]
            }
        });

        userStates[chatId] = {};

        return bot.sendMessage(chatId, '⏳ Qabul qilindi');
    }

    // ======================
    // SUPPORT
    // ======================
    if (state.step === 'support') {
        bot.sendMessage(adminId,
`🛠 Support

👤 ${msg.from.first_name}
🆔 ${chatId}

${text}`);

        return bot.sendMessage(chatId, 'Yuborildi');
    }
});

// ======================
// CALLBACKS
// ======================
bot.on('callback_query', (query) => {
    const data = query.data;

    if (data.startsWith('approveDeposit_')) {
        const userId = data.split('_')[1];
        bot.sendMessage(userId, '✅ Approved');
    }

    if (data.startsWith('rejectDeposit_')) {
        const userId = data.split('_')[1];
        bot.sendMessage(userId, '❌ Rejected');
    }

    if (data.startsWith('approveWithdraw_')) {
        const userId = data.split('_')[1];
        bot.sendMessage(userId, '✅ Paid');
    }

    if (data.startsWith('rejectWithdraw_')) {
        const userId = data.split('_')[1];
        bot.sendMessage(userId, '❌ Cancelled');
    }

    bot.answerCallbackQuery(query.id);
});
