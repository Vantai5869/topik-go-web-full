#!/bin/bash

domains=(topikgo.com www.topikgo.com)
data_path="./certbot"
email="" # Để trống nếu không muốn nhập email
staging=0 # Đổi thành 1 nếu test (tránh rate limit)

echo "### Khởi động containers với HTTP only ..."
docker-compose up -d
echo

echo "### Chờ 5 giây cho nginx khởi động ..."
sleep 5
echo

echo "### Request SSL certificate từ Let's Encrypt ..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal" certbot
echo

if [ $? -eq 0 ]; then
  echo "### SSL certificate đã được tạo thành công!"
  echo "### Đang bật HTTPS ..."

  # Copy nginx-ssl.conf thành nginx.conf
  cp nginx/nginx-ssl.conf nginx/nginx.conf

  # Reload nginx
  docker-compose exec nginx nginx -s reload

  echo "### XONG! Truy cập https://topikgo.com"
else
  echo "### LỖI: Không thể tạo SSL certificate"
  echo "### Website vẫn chạy trên http://topikgo.com"
fi
