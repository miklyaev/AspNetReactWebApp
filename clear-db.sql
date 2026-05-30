-- Скрипт для полной очистки данных во всех таблицах
-- ВНИМАНИЕ: Это удалит ВСЕ данные без возможности восстановления!

TRUNCATE TABLE 
    "TimeEntries", 
    "Comments", 
    "TaskItems", 
    "Projects", 
    "Goals", 
    "Profiles", 
    "Employees" 
RESTART IDENTITY CASCADE;

-- Если есть таблицы миграций или специфичные системные таблицы, их трогать не нужно.
-- RESTART IDENTITY сбрасывает счетчики ID до 1.
-- CASCADE гарантирует удаление зависимых записей.
