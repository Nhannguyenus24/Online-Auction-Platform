import { format, getTime, formatDistanceToNow, isSameDay } from 'date-fns';

// ----------------------------------------------------------------------

export function fDate(date) {
  return format(new Date(date), 'dd MMMM yyyy');
}

export function fVNDate(date, formatStr = 'dd/MM/yyyy') {
  if (date) return format(new Date(date), formatStr);
  return '';
}
export function fVNDateStr(date) {
  const date2 = new Date(date);
  const day = date2.getDate();
  const month = date2.getMonth() + 1;
  const year = date2.getFullYear();

  const formattedDate = `Ngày ${day < 10 ? `0${day}` : day} tháng ${month < 10 ? `0${month}` : month} năm ${year}`;
  return formattedDate;
}

export function countDaysFromDate(inputDate) {
  const inputDateObject = new Date(inputDate);

  // Get the current date
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  const timeDifference = inputDateObject - currentDate;

  // Calculate the number of days by dividing the absolute value of the time difference by the number of milliseconds in a day
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  return daysDifference;
}

export function fVNDateTime(date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export function fDateTimeStr(date) {
  const dateTime = new Date(date); // replace this with your own date and time object
  const options = {
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh', // replace this with your desired timezone
  };
  return dateTime
    .toLocaleDateString('vi-VN', options)
    .replace(/,/g, '')
    .replace(/\s/g, ' ')
    .replace(/(\d{1,2}:\d{1,2})/, 'Lúc $1,');
}
export function fSQLDate(date) {
  const parsedDate = Date.parse(date, 'yyyy-MM-dd', new Date());

  if (!isNaN(parsedDate)) {
    return format(parsedDate, 'yyyy-MM-dd');
  }

  return null;
}

export function fDateTime(date) {
  return format(new Date(date), 'dd MMM yyyy HH:mm');
}

export function fTimestamp(date) {
  return getTime(new Date(date));
}

export function fDateTimeSuffix(date) {
  return format(new Date(date), 'dd/MM/yyyy hh:mm p');
}

export function fToNow(date) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
}

export function fWorkTime(timeStr) {
  // Dữ liệu đầu vào: "HH:mm:ss"
  // Kết quả mong muốn: "HH:mm"
  if (!timeStr || typeof timeStr !== 'string') return '';

  return timeStr.slice(0, 5); // Cắt lấy phần "HH:mm"
}

export function fAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
     
    age--;
  }
  return age;
}

export function isBirthday(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
}

export const isVietnamNationalHoliday = () => {
  const currentDate = new Date();

  // List of Vietnam's national holidays
  const holidays = [
    // International New Year's Day
    new Date(currentDate.getFullYear(), 0, 1),
    new Date(currentDate.getFullYear(), 0, 2),
    new Date(currentDate.getFullYear(), 0, 3),

    // Tet holiday
    new Date(currentDate.getFullYear(), 1, 8), // Tet holiday
    new Date(currentDate.getFullYear(), 1, 9), // Vietnamese New Year's Eve
    new Date(currentDate.getFullYear(), 1, 10), // Vietnamese New Year
    new Date(currentDate.getFullYear(), 1, 11), // Tet holiday
    new Date(currentDate.getFullYear(), 1, 12), // Tet holiday
    new Date(currentDate.getFullYear(), 1, 13), // Tet holiday
    new Date(currentDate.getFullYear(), 1, 14), // Tet holiday

    // Labor Day
    new Date(currentDate.getFullYear(), 4, 1),

    // Liberation Day/Reunification Day
    new Date(currentDate.getFullYear(), 3, 30),

    // Independence Day
    new Date(currentDate.getFullYear(), 8, 2),
    new Date(currentDate.getFullYear(), 8, 3),

    // Vietnamese Women's Day
    new Date(currentDate.getFullYear(), 9, 20),

    // Christmas
    new Date(currentDate.getFullYear(), 11, 24),
    new Date(currentDate.getFullYear(), 11, 25),

    // new Date(currentDate.getFullYear(), 3, 3),
    // Add more holidays as needed
  ];

  return holidays.some((holiday) => isSameDay(currentDate, holiday));
};
