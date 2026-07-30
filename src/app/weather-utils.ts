export function getWeatherInfo(code: number, isDay: boolean = true): { icon: string; label: string } {
    // 맑음
    if (code === 0) return { icon: isDay ? "☀️" : "🌙", label: "맑음" };
    
    // 대체로 맑음, 부분적으로 흐림
    if (code === 1) return { icon: isDay ? "🌤️" : "🌙", label: "대체로 맑음" };
    if (code === 2) return { icon: "⛅", label: "부분적으로 흐림" };
    if (code === 3) return { icon: "☁️", label: "흐림" };
    
    // 안개
    if (code === 45 || code === 48) return { icon: "🌫️", label: "안개" };
    
    // 이슬비
    if (code >= 51 && code <= 55) return { icon: "🌦️", label: "약한 비" }; 
    if (code === 56 || code === 57) return { icon: "🌧️", label: "얼음비" };
    
    // 비
    if (code >= 61 && code <= 65) return { icon: "🌧️", label: "비" };
    if (code === 66 || code === 67) return { icon: "🌨️", label: "얼음비" };
    
    // 눈
    if (code >= 71 && code <= 75) return { icon: "🌨️", label: "눈" };
    if (code === 77) return { icon: "❄️", label: "싸락눈" };
    
    // 소나기
    if (code >= 80 && code <= 82) return { icon: "🌦️", label: "소나기" };
    if (code === 85 || code === 86) return { icon: "🌨️", label: "눈 소나기" };
    
    // 뇌우
    if (code === 95) return { icon: "⛈️", label: "뇌우" };
    if (code === 96 || code === 99) return { icon: "⛈️", label: "우박 뇌우" };
    
    return { icon: "🌡️", label: "알 수 없음" };
  }