import os
from loguru import logger
from telegram.ext import Application, CommandHandler

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not TELEGRAM_BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN não definido nas variáveis de ambiente.")
    exit(1)

def start(update, context):
    update.message.reply_text("Olá! Eu sou o bot do Apoia.se.")

def main():
    logger.info("Iniciando o bot do Telegram...")
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.run_polling()

if __name__ == "__main__":
    main() 