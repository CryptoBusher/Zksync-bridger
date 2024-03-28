## 🚀 Zksync bridger
❗️ <b>До 31 марта 2024 года происходит автоклейм забридженных монет в мейннет, после этого прийдется совершать транзакцию в мейннете эфира, которая будет стоить денег. Скрипт может сохранить свою актуальность (процесс пополнения будет включать в себя дополнительную транзакцию в мейннете + это может быть не дороже чем обычное пополнение с биржи), однако вам следует с этим считаться</b>
Скрипт предназначен для дешевого пополнения ETH mainnet. Он выводит ETH c OKX на кошелек в zkSync Era сеть и использует оффициальный zkSync Era мост для отправки денег в мейннет. Это позволяет добиться почти 20-ти кратной экономии на комиссиях.

Связь с создателем: https://t.me/CrytoBusher <br>
Если ты больше по Твиттеру: https://twitter.com/CryptoBusher <br>

Залетай сюда, чтоб не пропускать дропы подобных скриптов: https://t.me/CryptoKiddiesClub <br>
И сюда, чтоб общаться с крутыми ребятами: https://t.me/CryptoKiddiesChat <br>

## 📚 Первый запуск
1. Устанавливаем [NodeJs](https://nodejs.org/en/download)
2. Скачиваем проект, в терминале, находясь в папке проекта, вписываем команду "npm i" для установки всех зависимостей
3. Настраиваем "config.json":
   1. okxAuth - ваши API данные для OKX (ключ, сикрет, пасс), генерируются в личном кабинете OKX
   2. telegramData - данные для логов в телеграм
      1. botToken - генерируется через [BotFather](https://t.me/BotFather)
      2. chatIds - список ID чатов, в которые надо слать уведомления. Если хотите слать в чат супергруппы - указываете так: "supergroupId/chatId"
   3. gasPrices - настройки ожидания газа
      1. startMainnetGwei - стартовый гвей (ожидание газа начинается с этого значения с каждым новым аккаунтом), например 30
      2. step - шаг увеличения газа. Например 5 (тогда ожидаемый газ будет увеличиваться 30 -> 35 -> 40 -> 45...)
      3. delayMinutes - задержка между увеличением газа в минутах (например текущее ожидание 30 GWEI, через 10 минут будет 35 GWEI...)
      4. maxMainnetGwei - предел повышения газа, например, если указать 60, то после достижения этого значения ожидаемый газ больше увеличиваться не будет
      5. waitForGasBeforeCexWithdraw - ждать ли газ перед выводом с биржи
   4. tryToBridgeTimes - сколько раз пытаться забриджить деньги перед тем как выкинуть кошелек в фейлы
   5. delayBeforeBridgeTriesSec - сколько ждать (сек) перед повторной попыткой бриджа
   6. zkSyncRPC - нода, можно оставить как есть
   7. mainnetRPC - нода для мейннета (используется для ожидания газа)
   8. minWithdrawAmount - минимальное количество ETH для вывода с биржи
   9. maxWithdrawAmount - максимальное количество ETH для вывода с биржи
   10. minWithdrawDecimals - минимальное количество знаков после запятой в сумме вывода
   11. maxWithdrawDecimals - максимальное количество знаков после запятой в сумме вывода
   12. minBridgePercent - минимальный процент от суммы вывода под бридж (например, если указать 95 - минимум 95% от суммы вывода с биржи будет забриджено zkSync -> ETH mainnet)
   13. maxBridgePercent - максимальный процент от суммы вывода под бридж (например, если указать 99 - максимум 99% от суммы вывода с биржи будет забриджено zkSync -> ETH mainnet)
   14. minBridgeDecimals - минимальное количество знаков после запятой в сумме бриджа
   15. maxBridgeDecimals - максимальное количество знаков после запятой в сумме бриджа
   16. minDelayBeforeBridgeSec - минимальная задержка между выводом с биржи и бриджем (секунды)
   17. maxDelayBeforeBridgeSec - максимальная задержка между выводом с биржи и бриджем (секунды)
   18. minDelayBetweenAccsSec - минимальная задержка между аккаунтами (секунды)
   19. maxDelayBetweenAccsSec - максимальная задержка между аккаунтами (секунды)
   20. maxWithdrawalWaitSec - как долго ждать пополнения кошелька с биржи перед тем как скипнуть кошелек
   21. shuffleWallets - перемешать порядок прогона кошельков? (true / false)
4. Вносим данные в текстовик "walletsData" в формате "name|privateKey|httpProxy". Прокси в формате http://user:pass@host:port. Если не хотите использовать прокси для конкретного кошелька, то формат будет "name|privateKey". Каждый кошелек с новой строки.
5. Запускаем скрипт командой "node index.js". Если запускаетесь на сервере - "npm run start", тогда просмотреть лог можно в файле "out.log", а отслеживать в консоли прогресс можно командой "tail -f out.log".
6. Изначальный файл "walletsData.txt" не будет изменяться скриптом, потому, при повторном запуске, при необходимости, нужно его обновить.Скрипт будет обновлять следующие файлы (создаст сам):
   1. "failedWallets.txt" - кошельки, которые не удалось прогнать (фейл пополнения или бриджа), формат сохраняется
   2. "successWallets.txt" - кошельки, которые удалось прогнать (формат "name|amountWithdrawedFromCex")
   3. "remainingWallets.txt" - оставшиеся кошельки (формат сохраняется)

## 🤔 Дополнительная информация
- Скрипт шлет Legacy транзы (в zkSync почти везде транзы EIP (type 2), однако мост, почему - то, работает с Legacy транзами (type 0)). В данном случае ручные транзы через метамаск тоже Legacy, так что делать надо именно так. 
- Средства с zkSync Era в Mainnet бриджатся почти 24 часа
- Минимальная сумма бриджа должна составлять 0.01 ETH (советую минималку указывать чуть больше). Если забриджите меньшую сумму - придется ее клеймить в мейннете (защита проекта от абуза). Такая транзакция на клейм будет стоить долларов 5.
- Учитывайте, что скрипт можно настроить на бридж неполной суммы вывода с биржи, надо просчитывать суммы так, чтоб бриджилось не меньше 0.01 ETH (например, если указали минимальный процент бриджа 90, то минимальная сумма вывода должна быть ~ 0.0115 ETH), лучше закладывать запас.
- Перед запуском скрипта настоятельно рекомендую проверить анонсы в оффициальном дискорде zkSync, так как минимальную суммы бриджа без клейма могут поменять.
- Я не несу ответственность за неверное использование скрипта и возможные изменения в политике zkSync, всегда делайте тестовый прогон
