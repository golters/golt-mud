import { INPUT_EVENT, LOG_EVENT } from "../../../events"
import { commandEmitter } from "../commands"
import "./Terminal.css"

export const LogItem = (...children: (string | Node)[]) => {
  const message = document.createElement("div")
  message.className = "message"

  message.append(...children)

  return message
}

export const ErrorMessage = (textContent: string) => {
  const container = document.createElement("span")
  container.className = "error-message"
  container.textContent = textContent

  return container
}

export const ChatMessage = (textContent: string) => {
  const container = document.createElement("span")
  container.className = "chat-message"
  container.textContent = textContent

  return container
}

export const Terminal = () => {
  let hasScrolled = false

  const container = document.createElement("div")
  container.id = "terminal"

  const scrollToBottom = () => {
    window.scrollTo(0, document.body.scrollHeight)
  }

  const scrollToBottomIfActive = () => {
    if (!hasScrolled) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }

  const arrow = document.createElement("span")
  arrow.textContent = "> "

  const input = document.createElement("div")
  input.contentEditable = "true"
  input.spellcheck = false
  input.focus()

  const inputContainer = LogItem(arrow, input)
  inputContainer.id = "terminal-input-container"
  container.appendChild(inputContainer)

  const submit = () => {
    if (input.textContent.trim() === "") return

    container.insertBefore(
      LogItem(`> ${input.textContent}`),
      inputContainer,
    )
    
    commandEmitter.emit(INPUT_EVENT, input.textContent)

    input.textContent = ""

    requestAnimationFrame(() => {
      scrollToBottom()
    })
  }
  

  // disable rich pastes
  input.addEventListener("paste", event => {
    event.preventDefault()
    const text = event.clipboardData.getData("text/plain")
    document.execCommand("insertHTML", false, text)
  })

  input.addEventListener("keydown", event => {
    switch (event.key) {
      case "Enter": {
        if (!event.shiftKey) {
          event.preventDefault()

          submit()
        }

        break
      }
    }
  })

  input.addEventListener("input", () => {
    scrollToBottom()
  })

  window.addEventListener("click", event => {
    if ((event.target as HTMLElement).nodeName === "HTML") {
      input.focus()
    }
  })

  commandEmitter.on(LOG_EVENT, (...log: (string | Node)[]) => {
    container.insertBefore(
      LogItem(...log),
      inputContainer,
    )

    scrollToBottomIfActive()
  })

  window.addEventListener('resize', () => {
    scrollToBottomIfActive()
  })

  window.addEventListener('scroll', event => {
    hasScrolled = window.scrollY < document.body.scrollHeight - window.innerHeight
  })

  return container
}