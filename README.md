# seaa-demo

shell for seaa wallet operation

命令行钱包操作（仅针对seaaps）

## Shell Commander

```shell

# 生成keystore文件
secret #钱包秘钥
password #密码
node generate-keystore.js -s $secret -p $password

# 获取资产
address #钱包地址
node get-balance.js -A $address

# 查看密钥
address #钱包地址
password #密码
node get-secret.js -A $address -P $passowrd

```
