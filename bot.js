const express = require("express");
const TelegramBot = require('node-telegram-bot-api');

const app = express();

// ======================
// ENV (FIX)
// ======================
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminId = Number(process.env.ADMIN_ID);

console.log("BOT STARTING...");
console.log("TOKEN OK:", !!token);
console.log("ADMIN_ID:", adminId);

if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing!");
}

if (!adminId) {
    throw new Error("ADMIN_ID is missing!");
}

// ======================
// BOT
// ======================
const bot = new TelegramBot(token, { polling: true });

bot.on("polling_error", (err) => {
    console.log("POLLING ERROR:", err?.message || err);
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
// KARTALAR (YOUR ORIGINAL)
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
// MENU (YOUR TEXTS)
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

    bot.sendMessage(msg.chat.id,
        'Assalomu alaykum!'
    );

    mainMenu(msg.chat.id);
});

// ======================
// MESSAGE HANDLER (YOUR LOGIC)
// ======================
bot.on('message', async (msg) => {

    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text === '/start') return;

    if (chatId == adminId) return;

    if (!userStates[chatId]) {
        userStates[chatId] = {};
    }

    const state = userStates[chatId];

    // ======================
    // MAIN MENU (UNCHANGED TEXTS)
    // ======================

    if (text === '💳 Hisobni to‘ldirish') {

        state.step = 'deposit_id';

        return bot.sendMessage(chatId,
`1xBet ID raqamingizni yuboring.

⚠️ Diqqat:
ID raqamni noto‘g‘ri yuborsangiz, mablag‘ boshqa hisobga tushib ketishi mumkin.`,
        {
            reply_markup: {
                keyboard: [['🔙 Asosiy menyu']],
                resize_keyboard: true
            }
        });
    }

    if (text === '💸 Pul yechish') {

        state.step = 'withdraw_screenshot';

        return bot.sendMessage(chatId,
`1xBet platformasida pul chiqarish bo‘limiga kiring.

🏦 Nalichniye (1xBet logosi bilan)

📍 Shahar:
Chust

📍 Manzil:
ZEUS (24/7)

⚠️ Muhim:
Kassada berilgan maxsus kod screenshotda ko‘rinishi shart.

Screenshotni yuboring.`,
        {
            reply_markup: {
                keyboard: [['🔙 Asosiy menyu']],
                resize_keyboard: true
            }
        });
    }

    if (text === '🛠 Support') {

        state.step = 'support';

        return bot.sendMessage(chatId,
`Muammo yoki savolingizni yozib yuboring.

Operator tez orada siz bilan bog‘lanadi.`,
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

    if (text === '🔙 Asosiy menyu') {
        userStates[chatId] = {};
        return mainMenu(chatId);
    }

    if (text === '📞 Operator kontakti') {
        return bot.sendMessage(chatId, 'Operator: @Kassa_1xbt');
    }

    // ======================
    // DEPOSIT FLOW (YOUR TEXTS)
    // ======================

    if (state.step === 'deposit_id') {
        state.betId = text;
        state.step = 'deposit_amount';

        return bot.sendMessage(chatId, 'To‘ldirmoqchi bo‘lgan summani kiriting.');
    }

    if (state.step === 'deposit_amount') {
        state.amount = text;
        state.step = 'deposit_screenshot';

        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        state.card = randomCard;

        return bot.sendMessage(chatId,
`To‘lov uchun karta:

💳 ${randomCard.number}
👤 ${randomCard.owner}

To‘lov qilgandan so‘ng screenshot yuboring.`
        );
    }

    if (state.step === 'deposit_screenshot') {

        if (!msg.photo) {
            return bot.sendMessage(chatId, 'Iltimos screenshot yuboring.');
        }

        const photoId = msg.photo[msg.photo.length - 1].file_id;

        bot.sendPhoto(adminId, photoId, {
            caption:
`📥 Yangi to‘lov

👤 ${msg.from.first_name}
🆔 ${chatId}

🎮 1xBet ID:
${state.betId}

💰 Summa:
${state.amount}

💳 Karta:
${state.card.number}`,
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

        return bot.sendMessage(chatId,
    `✅ To‘lov cheki qabul qilindi.

    ⏳ Operator tomonidan tekshirilmoqda.

    🕐 Odatda 5–10 daqiqa ichida ko‘rib chiqiladi.

    Tasdiqlangandan so‘ng mablag‘ hisobingizga tushiriladi.`);
    }

    // ======================
    // WITHDRAW FLOW (YOUR TEXTS)
    // ======================

    if (state.step === 'withdraw_screenshot') {

        if (!msg.photo) {
            return bot.sendMessage(chatId, 'Iltimos screenshot yuboring.');
        }

        state.withdrawPhoto = msg.photo[msg.photo.length - 1].file_id;
        state.step = 'withdraw_card';

        return bot.sendMessage(chatId,
`Karta raqamingizni yuboring.

⚠️ Diqqat:
Karta raqamni noto‘g‘ri yuborsangiz, mablag‘ boshqa kartaga tushib ketishi mumkin.`);
    }

    if (state.step === 'withdraw_card') {

        state.cardNumber = text;

        bot.sendPhoto(adminId, state.withdrawPhoto, {
            caption:
`💸 Pul yechish so‘rovi

👤 ${msg.from.first_name}
🆔 ${chatId}

💳 Karta:
${state.cardNumber}`,
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

        return bot.sendMessage(chatId,
`⏳ So‘rovingiz qabul qilindi.

Tasdiqlangandan so‘ng 5–10 daqiqa ichida mablag‘ kartangizga tushadi.`);
    }

    // ======================
    // SUPPORT (YOUR TEXTS)
    // ======================

    if (state.step === 'support') {

        bot.sendMessage(adminId,
`🛠 Support murojaati

👤 ${msg.from.first_name}
🆔 ${chatId}

✉️ Xabar:
${text}`);

        return bot.sendMessage(chatId,
            '✅ Xabaringiz operatorga yuborildi.'
        );
    }
});

// ======================
// CALLBACKS (UNCHANGED LOGIC)
// ======================

bot.on('callback_query', async (query) => {

    const data = query.data;

    if (data.startsWith('approveDeposit_')) {
    const userId = data.split('_')[1];

    bot.sendMessage(userId,
`✅ To‘lov tasdiqlandi.

💰 Mablag‘ hisobingizga muvaffaqiyatli tushirildi.

O‘yinlarda omad tilaymiz!`);
}

if (data.startsWith('rejectDeposit_')) {
    const userId = data.split('_')[1];

    bot.sendMessage(userId,
`❌ To‘lov tasdiqlanmadi.

Iltimos chekni qayta tekshirib yuboring yoki operator bilan bog‘laning.`);
}
    }

    if (data.startsWith('approveWithdraw_')) {
        const userId = data.split('_')[1];
        bot.sendMessage(userId, '✅ Kartangizga pul muvaffaqiyatli yuborildi.');
    }

    if (data.startsWith('rejectWithdraw_')) {
        const userId = data.split('_')[1];
        bot.sendMessage(userId, '❌ So‘rov bekor qilindi. Pul kassamizga yechilmagan yoki kod noto‘g‘ri bo‘lishi mumkin!');
    }

    bot.answerCallbackQuery(query.id);
});
