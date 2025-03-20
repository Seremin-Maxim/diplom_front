FROM node:16-alpine AS build

WORKDIR /app

# Копируем файлы package.json и package-lock.json для кэширования
COPY package*.json ./

# Устанавливаем зависимости с кэшированием
RUN npm ci --only=production

# Копируем исходный код
COPY public ./public
COPY src ./src

# Собираем приложение с оптимизациями
RUN npm run build

# Используем оптимизированный nginx для раздачи статических файлов
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Оптимизация Nginx
RUN rm /etc/nginx/conf.d/default.conf.default || true \
    && rm -rf /usr/share/nginx/html/index.html \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log

# Порт, который будет открыт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
