export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1  ,
    }).format(value);
}
export function formatName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}
export function formatTime(isoString) {
  if (!isoString) {
    return "";
  }

  // Parse DB timestamps as local time to avoid UTC-7h display drift in UI.
  const normalized = typeof isoString === "string"
    ? isoString.replace(" ", "T")
    : isoString;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

export function processTimestamp(input, offsetHours) {
    // 1. Regex kiểm tra định dạng DD/MM/YYYY, HH:mm:ss
    const regex = /^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})$/;
    const match = input.match(regex);

    if (match) {
        // Trích xuất các thành phần từ regex
        const [_, day, month, year, hour, minute, second] = match;
        
        // Tạo đối tượng Date
        let date = new Date(year, month - 1, day, hour, minute, second);

        // 2. Trừ đi offsetHours giờ
        date.setHours(date.getHours() + offsetHours);

        // 3. Định dạng lại kết quả trả về đúng chuẩn ban đầu
        const pad = (num) => String(num).padStart(2, '0');
        
        const newDay = pad(date.getDate());
        const newMonth = pad(date.getMonth() + 1);
        const newYear = date.getFullYear();
        const newHour = pad(date.getHours());
        const newMin = pad(date.getMinutes());
        const newSec = pad(date.getSeconds());

        return `${newDay}/${newMonth}/${newYear} ${newHour}:${newMin}:${newSec}`;
    } else {
        return "Định dạng không hợp lệ";
    }
}

export function formatDateTime(dateStr) {
  // Regex tìm các nhóm: ngày, tháng, năm và phần thời gian
  // Chuyển từ DD/MM/YYYY HH:mm:ss sang YYYY-MM-DD HH:mm:ss
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}:\d{2}:\d{2})$/;
  
  return dateStr.replace(regex, '$3-$2-$1 $4');
}

export function isValidDateTime(dateTimeStr) {
  // 1. Regex kiểm tra cấu trúc mặt chữ: 2 số/2 số/4 số 2 số:2 số:2 số
  const regex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
  const match = dateTimeStr.match(regex);

  if (!match) return false;

  // 2. Tách các thành phần để kiểm tra logic thời gian
  const [_, day, month, year, hour, minute, second] = match.map(Number);

  // 3. Sử dụng đối tượng Date để kiểm tra tính hợp lệ (ví dụ: tháng 2 có 29 ngày không)
  const date = new Date(year, month - 1, day, hour, minute, second);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second
  );
}