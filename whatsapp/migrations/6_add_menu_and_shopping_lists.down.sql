-- Rollback migration: eliminar tablas de menús y listas de compras
DROP TABLE IF EXISTS frest_orders CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS weekly_menus CASCADE;

