/**
 * Utility functions for time formatting
 */

/**
 * Convert time from 24-hour format (HH:mm:ss or HH:mm) to 12-hour format
 * @param time - Time string in format HH:mm:ss or HH:mm
 * @returns Formatted time string in 12-hour format (e.g., "2:30 ص" or "10:45 م")
 */
export function formatTime12Hour(time: string): string {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  const hour = hours;
  const min = minutes;
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get current time in 12-hour format
 * @returns Current time string in 12-hour format
 */
export function getCurrentTime12Hour(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const period = hours >= 12 ? 'م' : 'ص';
  const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get current time in 12-hour format without seconds
 * @returns Current time string in 12-hour format (HH:mm)
 */
export function getCurrentTime12HourShort(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? 'م' : 'ص';
  const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format date and time in Arabic format
 * @param date - Date object or date string
 * @returns Formatted date and time string
 */
export function formatDateTime12Hour(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'م' : 'ص';
  const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}/${month}/${year} ${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

