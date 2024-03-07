import { useState, useMemo, useId, Fragment, useRef, FormEvent } from "react"
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
import { EVENT_COLORS, useEvents } from "../context/useEvents"
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
  const isNew = event == null
  const formId = useId()
  const [selectedColor, setSelectedColor] = useState(event?.color || EVENT_COLORS[0])
  const [isAllDayChecked, setIsAllDayChecked] = useState(event?.allDay || false)
  const [startTime, setStartTime] = useState(event?.startTime || "")
  const endTimeRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const name = nameRef.current?.value
    const endTime = nameRef.current?.value

    if (name == null || name === "") return

    const commonProps = {
      name,
      date: date || event?.date,
      color: selectedColor,
    }

    let newEvent: UnionOmit<Event, "id">

    if (isAllDayChecked) {
      newEvent = {
        ...commonProps,
        allDay: true,
      }
    } else {
      if (startTime == null || startTime === "" || endTime == null || endTime === "") return
      newEvent = {
        ...commonProps,
        allDay: false,
        startTime: startTime,
        endTime: endTime,
      }
    }

    console.log(newEvent)
    onSubmit(newEvent)
    modalProps.onClose()
  }

  return (
    <Modal {...modalProps}>
      <div className="modal-title">
        <div>{isNew ? "Add" : "Edit"} Event</div>
        <small>{formatDate(date || event.date, { dateStyle: "short" })}</small>
        <button className="close-btn" onClick={modalProps.onClose}>
          &times;
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`${formId}-name`}>Name</label>
          <input ref={nameRef} required type="text" id={`${formId}-name`} />
        </div>
        <div className="form-group checkbox">
          <input
            checked={isAllDayChecked}
            onChange={(e) => setIsAllDayChecked(e.target.checked)}
            type="checkbox"
            id={`${formId}-all-day`}
          />
          <label htmlFor={`${formId}-all-day`}>All Day?</label>
        </div>
        <div className="row">
          <div className="form-group">
            <label htmlFor={`${formId}-start-time`}>Start Time</label>
            <input
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required={!isAllDayChecked}
              disabled={isAllDayChecked}
              type="time"
              id={`${formId}-start-time`}
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${formId}-end-time`}>End Time</label>
            <input
              ref={endTimeRef}
              min={startTime}
              required={!isAllDayChecked}
              disabled={isAllDayChecked}
              type="time"
              id={`${formId}-end-time`}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="row left">
            {EVENT_COLORS.map((color) => (
              <Fragment key={color}>
                <input
                  type="radio"
                  name="color"
                  value={color}
                  id={`${formId}-${color}`}
                  checked={selectedColor === color}
                  onChange={() => setSelectedColor(color)}
                  className="color-radio"
                />
                <label htmlFor={`${formId}-${color}`}>
                  <span className="sr-only">{color}</span>
                </label>
              </Fragment>
            ))}
            <input type="radio" value="red" id={`${formId}-red`} className="color-radio" />
          </div>
        </div>
        <div className="row">
          <button className="btn btn-success" type="submit">
            {isNew ? "Create" : "Update"}
          </button>
          {onDelete != null && (
            <button className="btn btn-delete" type="button" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
