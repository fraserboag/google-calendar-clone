import { useState, useMemo } from "react"
import {
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isBefore,
  endOfDay,
  isToday,
  subMonths,
  addMonths,
} from "date-fns"
import { formatDate } from "../utils/formatDate"
import { cc } from "../utils/cc"
import { useEvents } from "../context/useEvents"
import { Modal, ModalProps } from "./Modal"
import { UnionOmit } from "../utils/types"
import { Event } from "../context/Events"

export function Calendar() {
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const calendarDays = useMemo(() => {
    const firstWeekStart = startOfWeek(startOfMonth(selectedMonth))
    const lastWeekEnd = endOfWeek(endOfMonth(selectedMonth))
    return eachDayOfInterval({ start: firstWeekStart, end: lastWeekEnd })
  }, [selectedMonth])

  return (
    <div className="calendar">
      <div className="header">
        <button className="btn" onClick={() => setSelectedMonth(new Date())}>
          Today
        </button>
        <div>
          <button className="month-change-btn" onClick={() => setSelectedMonth((m) => subMonths(m, 1))}>
            &lt;
          </button>
          <button className="month-change-btn" onClick={() => setSelectedMonth((m) => addMonths(m, 1))}>
            &gt;
          </button>
        </div>
        <span className="month-title">{formatDate(selectedMonth, { month: "long", year: "numeric" })}</span>
      </div>
      <div className="days">
        {calendarDays.map((day, index) => (
          <CalendarDay key={day.getTime()} day={day} showWeekDay={index < 7} selectedMonth={selectedMonth} />
        ))}
      </div>
    </div>
  )
}

type CalendarDayProps = {
  day: Date
  showWeekDay: boolean
  selectedMonth: Date
}

function CalendarDay({ day, showWeekDay, selectedMonth }: CalendarDayProps) {
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false)
  const { addEvent } = useEvents()

  return (
    <div
      className={cc(
        "day",
        !isSameMonth(day, selectedMonth) && "non-month-day",
        isBefore(endOfDay(day), new Date()) && "old-month-day"
      )}
    >
      <div className="day-header">
        {showWeekDay && <div className="week-name">{formatDate(day, { weekday: "short" })}</div>}
        <div className={cc("day-number", isToday(day) && "today")}>{formatDate(day, { day: "numeric" })}</div>
        <button className="add-event-btn" onClick={() => setIsNewEventModalOpen(true)}>
          +
        </button>
      </div>
      <EventFormModal
        date={day}
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onSubmit={addEvent}
      />
    </div>
  )
}

type EventFormModalProps = {
  onSubmit: (event: UnionOmit<Event, "id">) => void
} & (
  | {
      onDelete: () => void
      event: Event
      date?: never
    }
  | {
      onDelete?: never
      event?: never
      date: Date
    }
) &
  Omit<ModalProps, "children">

function EventFormModal({ onSubmit, onDelete, event, date, ...modalProps }: EventFormModalProps) {
  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <div>Add Event</div>
        <small>6/8/23</small>
        <button className="close-btn">&times;</button>
      </div>
      <form>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input type="text" name="name" id="name" />
        </div>
        <div className="form-group checkbox">
          <input type="checkbox" name="all-day" id="all-day" />
          <label htmlFor="all-day">All Day?</label>
        </div>
        <div className="row">
          <div className="form-group">
            <label htmlFor="start-time">Start Time</label>
            <input type="time" name="start-time" id="start-time" />
          </div>
          <div className="form-group">
            <label htmlFor="end-time">End Time</label>
            <input type="time" name="end-time" id="end-time" />
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="row left">
            <input type="radio" name="color" value="blue" id="blue" checked className="color-radio" />
            <label htmlFor="blue">
              <span className="sr-only">Blue</span>
            </label>
            <input type="radio" name="color" value="red" id="red" className="color-radio" />
            <label htmlFor="red">
              <span className="sr-only">Red</span>
            </label>
            <input type="radio" name="color" value="green" id="green" className="color-radio" />
            <label htmlFor="green">
              <span className="sr-only">Green</span>
            </label>
          </div>
        </div>
        <div className="row">
          <button className="btn btn-success" type="submit">
            Add
          </button>
          <button className="btn btn-delete" type="button">
            Delete
          </button>
        </div>
      </form>
    </Modal>
  )
}
