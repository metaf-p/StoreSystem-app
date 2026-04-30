# Используем официальный образ Python
FROM python:3.10-bullseye

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем файл зависимостей (requirements.txt) в контейнер
COPY requirements.txt .

# Устанавливаем переменную в системе
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения в контейнер
COPY . .   

# Открываем порт для взаимодействия с приложением
EXPOSE 8000

# Запуск приложения с помощью Uvicorn (если это FastAPI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]