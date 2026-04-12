const BASE_URL = 'http://localhost:3000'

function getToken() { return localStorage.getItem('token') }
function setToken(t) { localStorage.setItem('token', t) }
function clearToken() { localStorage.removeItem('token') }
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

const authSection = document.getElementById('auth-section')
const appSection = document.getElementById('app-section')
const todoContainer = document.querySelector('.todo-container')
const inputTodo = document.getElementById('input-todo')
const addTodo = document.getElementById('add-todo')
const logoutBtn = document.getElementById('logout-btn')

function showApp() { authSection.style.display = 'none'; appSection.style.display = 'block' }
function showLogin() { authSection.style.display = 'block'; appSection.style.display = 'none' }

async function handleCredentialResponse(response) {
  const res = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: response.credential })
  })
  const data = await res.json()
  if (data.token) {
    setToken(data.token)
    showApp()
    init()
  }
}

async function setupGoogleSignIn() {
  const res = await fetch(`${BASE_URL}/auth/config`)
  const data = await res.json()
  if (!data.clientId) return
  google.accounts.id.initialize({
    client_id: data.clientId,
    callback: handleCredentialResponse
  })
  google.accounts.id.renderButton(
    document.getElementById('google-btn'),
    { theme: 'outline', size: 'large' }
  )
}

logoutBtn.addEventListener('click', () => {
  clearToken()
  showLogin()
})

async function getTodos() {
  const res = await fetch(`${BASE_URL}/todos`, { headers: authHeaders() })
  return res.json()
}

async function addTodoApi() {
  await fetch(`${BASE_URL}/todo`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ desc: inputTodo.value, comp: false })
  })
}

async function deleteTodo(id) {
  await fetch(`${BASE_URL}/todo/${id}`, { method: 'DELETE', headers: authHeaders() })
  init()
}

async function updateTodo(id, desc, comp) {
  await fetch(`${BASE_URL}/todo/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ desc, comp })
  })
  init()
}

function displayTodos(todos) {
  todoContainer.innerHTML = ''
  todos.forEach(todo => {
    const todoDiv = document.createElement('div')
    todoDiv.classList.add('todo')

    const todoInfo = document.createElement('div')
    todoInfo.classList.add('todo-info')

    const todoName = document.createElement('p')
    todoName.textContent = todo.desc

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = todo.comp
    checkbox.addEventListener('change', () => {
      updateTodo(todo._id, todo.desc, checkbox.checked)
    })

    const btnWrapper = document.createElement('div')
    btnWrapper.classList.add('todo-btn')

    const editBtn = document.createElement('button')
    editBtn.textContent = 'Edit'
    editBtn.addEventListener('click', () => {
      const newText = prompt('Edit todo', todo.desc)
      if (newText) updateTodo(todo._id, newText, todo.comp)
    })

    const deleteBtn = document.createElement('button')
    deleteBtn.textContent = 'Delete'
    deleteBtn.addEventListener('click', () => deleteTodo(todo._id))

    todoInfo.appendChild(checkbox)
    todoInfo.appendChild(todoName)
    btnWrapper.appendChild(editBtn)
    btnWrapper.appendChild(deleteBtn)
    todoDiv.appendChild(todoInfo)
    todoDiv.appendChild(btnWrapper)
    todoContainer.appendChild(todoDiv)
  })
}

async function init() {
  const todos = await getTodos()
  displayTodos(todos)
}

addTodo.addEventListener('click', async (e) => {
  e.preventDefault()
  if (!inputTodo.value.trim()) return
  await addTodoApi()
  inputTodo.value = ''
  init()
})

if (getToken()) {
  showApp()
  init()
} else {
  showLogin()
  setupGoogleSignIn()
}