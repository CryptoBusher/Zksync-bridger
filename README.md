## 🚀 Zksync bridger
Скрипт предназначен для дешевого пополнения ETH mainnet. Он выводит ETH c OKX на кошелек в zkSync Era сеть и использует оффициальный zkSync Era мост для отправки денег в мейннет. Это позволяет добиться почти 10-ти кратной экономии на комиссиях.

Связь с создателем: https://t.me/CrytoBusher <br>
Если ты больше по Твиттеру: https://twitter.com/CryptoBusher <br>

Залетай сюда, чтоб не пропускать дропы подобных скриптов: https://t.me/CryptoKiddiesClub <br>
И сюда, чтоб общаться с крутыми ребятами: https://t.me/CryptoKiddiesChat <br>

## 📚 Первый запуск
1. Устанавливаем [NodeJs](https://nodejs.org/en/download)
2. Скачиваем проект, в терминале, находясь в папке проекта, вписываем команду "npm i" для установки всех зависимостей
3. Настраиваем "config.json":
   1. okxAuth - ваши API данные для OKX (ключ, сикрет, пасс), генерируются в личном кабинете OKX
   2. zkSyncRPC - нода, можно оставить как есть
   3. minWithdrawAmount - минимальное количество ETH для вывода с биржи
   4. maxWithdrawAmount - максимальное количество ETH для вывода с биржи
   5. minWithdrawDecimals - минимальное количество знаков после запятой в сумме вывода
   6. maxWithdrawDecimals - максимальное количество знаков после запятой в сумме вывода
   7. minBridgePercent - минимальный процент от суммы вывода под бридж (например, если указать 95 - минимум 95% от суммы вывода с биржи будет забриджено zkSync -> ETH mainnet)
   8. maxBridgePercent - максимальный процент от суммы вывода под бридж (например, если указать 99 - максимум 99% от суммы вывода с биржи будет забриджено zkSync -> ETH mainnet)
   9. minBridgeDecimals - минимальное количество знаков после запятой в сумме бриджа
   10. maxBridgeDecimals - максимальное количество знаков после запятой в сумме бриджа
   11. minDelayBeforeBridgeSec - минимальная задержка между выводом с биржи и бриджем (секунды)
   12. maxDelayBeforeBridgeSec - максимальная задержка между выводом с биржи и бриджем (секунды)
   13. minDelayBetweenAccsSec - минимальная задержка между аккаунтами (секунды)
   14. maxDelayBetweenAccsSec - максимальная задержка между аккаунтами (секунды)
   16. maxWithdrawalWaitSec - как долго ждать пополнения кошелька с биржи перед тем как скипнуть кошелек
   17. shuffleWallets - перемешать порядок прогона кошельков? (true / false)
   18. skipIfFailedToSetProxy - пропускать кошелек если не удалос установить ENV прокси? (true / false)
4. Забиваем приватники в файл "privateKeys.txt", каждый с новой строки в виде NAME:PRIVATE_KEY
5. Забиваем прокси в файл "proxies.txt", каждый с новой строки в виде HTTP://USER:PASS@HOST:PORT. Порядок прокси должен соответствовать порядку кошельков. Можно оставить файл пустым для работы без прокси.  Если вбить 20 кошельков и 10 прокси - первые 10 кошельков прогонит через прокси, остальные 10 - без прокси. Прокси используются только под запросы на ноду, вывод с OKX работает без прокси.
6. Запускаем скрипт командой "node index.js"

## 🤔 Дополнительная информация
- Скрипт шлет EIP транзакции
- Средства с zkSync Era в Mainnet бриджатся почти 24 часа
- Минимальная сумма бриджа должна составлять 0.01 ETH (советую минималку указывать чуть больше). Если забриджите меньшую сумму - придется ее клеймить в мейннете (защита проекта от абуза). Такая транзакция на клейм будет стоить долларов 5.
- Учитывайте, что скрипт можно настроить на бридж неполной суммы вывода с биржи, надо просчитывать суммы так, чтоб бриджилось не меньше 0.01 ETH (например, если указали минимальный процент бриджа 90, то минимальная сумма вывода должна быть ~ 0.0115 ETH), лучше закладывать запас.
- Перед запуском скрипта настоятельно рекомендую проверить анонсы в оффициальном дискорде zkSync, так как минимальную суммы бриджа без клейма могут поменять.
- Я не несу ответственность за неверное использование скрипта и возможные изменения в политике zkSync, всегда делайте тестовый прогон
