const formatTime = (input) => {
  if (!input) return null;

  const [datePart, timePart = "00:00:00"] = input.trim().split(" ");

  const [day, month, year] = datePart.split("/");

  let [hour = "00", minute = "00", second = "00"] = (timePart || "")
    .split(":")
    .concat(["00", "00"]); // đảm bảo đủ 3 phần

  const localDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  // Convert sang UTC rồi format MySQL
  const yyyy = localDate.getUTCFullYear();
  const mm = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(localDate.getUTCDate()).padStart(2, "0");

  const hh = String(localDate.getUTCHours()).padStart(2, "0");
  const mi = String(localDate.getUTCMinutes()).padStart(2, "0");
  const ss = String(localDate.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

module.exports = {
    formatTime
}