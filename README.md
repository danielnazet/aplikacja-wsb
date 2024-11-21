# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


// MOJE PRZEMYSLENIA I FUNKCJE: 
1. Sekcja Statystyk i Kluczowych Wskaźników Wydajności (KPI)
Produkcja na dziś: Ilość wyprodukowanych jednostek w ciągu dnia.
Cele vs. rzeczywistość: Wykres słupkowy porównujący planowaną produkcję z rzeczywistą.
Efektywność maszyn (OEE): Średnia wydajność urządzeń w procentach.
Czas przestojów: Łączny czas przestoju maszyn w danym okresie.


3. Stan Maszyn
Lista maszyn: Informacje o stanie każdej maszyny (działa, serwis, awaria).
Historia serwisów: Przeglądy i naprawy każdej maszyny.
Alerty awarii: Powiadomienia o problemach technicznych, np. "Maszyna A przestała działać".


5. Zarządzanie Materiałami
Stan magazynu: Aktualne zapasy surowców i półproduktów.
Alerty braków: Powiadomienia o niskim poziomie kluczowych materiałów.
Śledzenie zamówień: Status dostaw surowców.


7. Monitorowanie Pracowników
Obecność: Lista obecności pracowników na zmianie.
Czas pracy: Godziny pracy w podziale na zmiany.
Wydajność zespołu: Produkcja przypadająca na pracownika lub grupę.



9. Harmonogram Produkcji
Plan produkcji: Co i kiedy ma być produkowane.
Postęp zadań: Wskaźnik procentowy ukończenia każdego etapu produkcji.
Zmiany w planie: Historia i uzasadnienie zmian w harmonogramie.



11. Śledzenie Jakości
Raporty jakości: Ilość wyprodukowanych wadliwych jednostek.
Kontrole: Wyniki testów jakościowych na poszczególnych etapach produkcji.
Reklamacje: Liczba i rodzaj zgłoszonych reklamacji przez klientów.



13. Wykresy i Wizualizacje
Wykresy czasu pracy maszyn: Porównanie czasu pracy w różnych dniach/zmianach.
Diagramy przepływu produkcji: Ilustracja procesu od surowców do gotowego produktu.
Wykresy trendów: Analiza wydajności produkcji w czasie.



15. System Alertów
Powiadomienia na żywo:
Opóźnienia w produkcji.
Niski poziom surowców.
Przekroczone czasy przestoju.
Kolory priorytetów: Alerty w kolorach np. czerwonym (krytyczne), żółtym (ostrzegawcze).



17. Moduł Analiz
Raporty finansowe: Koszty produkcji, zyski, ROI.
Prognozy: Analiza trendów i przewidywanie przyszłych wyników.
Analiza strat: Przyczyny przestojów lub wadliwości produktów.



19. Integracje
IoT (Internet of Things): Bezpośrednie połączenie z maszynami produkcyjnymi w celu monitorowania ich stanu.
System ERP: Synchronizacja z systemami zarządzania przedsiębiorstwem.
CRM: Dane dotyczące klientów i zamówień.



21. Funkcje Interaktywne
Widok na żywo: Monitoring hali produkcyjnej przez kamery.
Filtry i sortowanie: Możliwość wyświetlenia danych według okresu, maszyny, zespołu itp.
Eksport danych: Pobieranie raportów w formacie PDF, Excel itp.
Przykład Struktury Dashboardu
Górna nawigacja:
Logo firmy, wyszukiwarka, przyciski "Powiadomienia" i "Ustawienia".
Lewy panel boczny:
Linki do sekcji: Produkcja, Magazyn, Raporty, Ustawienia.
Główna sekcja:
Wykresy i statystyki na bieżąco.
Prawy panel:
Alerty na żywo i szybkie notatki.
