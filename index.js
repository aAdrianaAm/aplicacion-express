import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Database } from 'bun:sqlite'

const app = new Hono()

// 1. Habilitar CORS para que tu App móvil pueda conectarse
app.use('/*', cors())

// 2. Abrir/Crear la base de datos
const db = new Database('./base.sqlite3')
db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`)

// RUTA: Estado del servidor
app.get('/', (c) => {
    return c.json({ status: 'ok', message: 'Servidor de Adriana activo' })
})

// RUTA: Listar tareas (La que pide tu App móvil)
app.get('/lista_todos', (c) => {
    try {
        const todos = db.query("SELECT * FROM todos").all()
        return c.json(todos)
    } catch (err) {
        return c.json({ error: err.message }, 500)
    }
})

// RUTA: Agregar tarea (La que pide tu App móvil)
app.post('/agrega_todo', async (c) => {
    let body
    try {
        body = await c.req.json()
    } catch {
        return c.json({ error: 'Formato JSON inválido' }, 400)
    }

    const { todo } = body
    if (!todo) {
        return c.json({ error: 'Falta el campo todo' }, 400)
    }

    try {
        const stmt = db.prepare('INSERT INTO todos (todo) VALUES (?)')
        const result = stmt.run(todo)
        return c.json({ 
            id: Number(result.lastInsertRowid), 
            message: 'Insert was successful' 
        }, 201)
    } catch (err) {
        return c.json({ error: err.message }, 500)
    }
})

export { app, db }

export default {
    port: process.env.PORT || 3000,
    fetch: app.fetch,
}
