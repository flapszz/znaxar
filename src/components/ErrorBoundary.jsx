import { Component } from "react";

// Если одна часть страницы «упала», покупатель видит понятное сообщение и кнопку,
// а не белый экран.
export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Персональные данные в журнал не пишем — только сам сбой.
    console.error("Сбой интерфейса:", error?.message);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 520, margin: "20vh auto 0", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Что-то пошло не так</h1>
        <p style={{ marginTop: 12, lineHeight: 1.5 }}>
          Страница не смогла открыться. Обновите её — если не поможет, зайдите чуть позже. Товары и заявки не пропали.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, padding: "12px 20px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
        >
          Обновить страницу
        </button>
      </div>
    );
  }
}
