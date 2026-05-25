const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

// ======================
// ENV
// ======================
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminId = process.env.ADMIN_ID;

if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing in environment variables!");
}

if (!adminId) {
    throw new Error("ADMIN_ID is missing in environment variables!");
}

// ======================
// BOT
// ======================
const bot = new TelegramBot(token, {
    polling: true
});

// ======================
// EXPRESS
// ======================
app.get("/", (req, res) => {
    res.send("Bot ishlayapti");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

// ======================
// KARTALAR
// ======================
const cards = [
    {
        number: '6262 5700 7941 9950',
        owner: 'Ganiyev G'
    },

];

// ======================
// USER STATES
// ======================
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

    if (msg.text === '/start') return;

    if (chatId == adminId) return;

    if (!userStates[chatId]) {
        userStates[chatId] = {};
    }

    const state = userStates[chatId];

    // ======================
    // MAIN MENU
    // ======================
    if (msg.text === '💳 Hisobni to‘ldirish') {
        state.step = 'deposit_id';

        return bot.sendMessage(chatId,
`1xBet ID raqamingizni yuboring.

⚠️ Diqqat:
ID noto‘g‘ri bo‘lsa, mablag‘ boshqa hisobga tushadi.`,
        {
            reply_markup: {
                keyboard: [['🔙 Asosiy menyu']],
                resize_keyboard: true
            }
        });
    }

    if (msg.text === '💸 Pul yechish') {
        state.step = 'withdraw_screenshot';

        return bot.sendMessage(chatId,
`1xBet pul yechish bo‘limiga kiring.

📍 Chust / ZEUS (24/7)

Screenshot yuboring.`,
        {
            reply_markup: {
                keyboard: [['🔙 Asosiy menyu']],
                resize_keyboard: true
            }
        });
    }

    if (msg.text === '🛠 Support') {
        state.step = 'support';

        return bot.sendMessage(chatId,
`Muammo yozing.`,
        {
            reply_markup: {
                keyboard: [
                    ['📞 Operator kontakti'],
                    ['🔙 Asosiy menyu']
                ],
                resize_keyboard: true
            }
        });
    }

    if (msg.text === '🔙 Asosiy menyu') {
        userStates[chatId] = {};
        return mainMenu(chatId);
    }

    if (msg.text === '📞 Operator kontakti') {
        return bot.sendMessage(chatId, 'Operator: @Kassa_1xbt');
    }

    // ======================
    // DEPOSIT FLOW
    // ======================
    if (state.step === 'deposit_id') {
        state.betId = msg.text;
        state.step = 'deposit_amount';

        return bot.sendMessage(chatId, 'Summani kiriting.');
    }

    if (state.step === 'deposit_amount') {
        state.amount = msg.text;
        state.step = 'deposit_screenshot';

        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        state.card = randomCard;

        return bot.sendMessage(chatId,
`💳 ${randomCard.number}
👤 ${randomCard.owner}

Screenshot yuboring.`);
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
                        { text: '✅ Tasdiqlash', callback_data: `approveDeposit_${chatId}` },
                        { text: '❌ Bekor qilish', callback_data: `rejectDeposit_${chatId}` }
                    ]
                ]
            }
        });

        userStates[chatId] = {};

        return bot.sendMessage(chatId, '⏳ Tekshirilmoqda...');
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

        return bot.sendMessage(chatId, 'Karta raqam kiriting.');
    }

    if (state.step === 'withdraw_card') {
        state.cardNumber = msg.text;

        bot.sendPhoto(adminId, state.withdrawPhoto, {
            caption:
`💸 Withdraw

👤 ${msg.from.first_name}
🆔 ${chatId}

💳 ${state.cardNumber}`,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ To‘landi', callback_data: `approveWithdraw_${chatId}` },
                        { text: '❌ Bekor qilish', callback_data: `rejectWithdraw_${chatId}` }
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

${msg.text}`);

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
        bot.sendMessage(userId, '✅ Top up confirmed');
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
