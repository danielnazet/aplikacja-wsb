# React + Vite



// MOJE PRZEMYSLENIA I FUNKCJE:
DATA BASE USERS:
Admin: 
admin@admin.com
Admin123!@#

Brygadzista:
darek@wp.pl
Darek123





1. Sekcja Statystyk i Kluczowych Wskaźników Wydajności (KPI)
   Produkcja na dziś: Ilość wyprodukowanych jednostek w ciągu dnia.
   Cele vs. rzeczywistość: Wykres słupkowy porównujący planowaną produkcję z rzeczywistą.
   Efektywność maszyn (OEE): Średnia wydajność urządzeń w procentach.
   Czas przestojów: Łączny czas przestoju maszyn w danym okresie.

2. Stan Maszyn
   Lista maszyn: Informacje o stanie każdej maszyny (działa, serwis, awaria).
   Historia serwisów: Przeglądy i naprawy każdej maszyny.
   Alerty awarii: Powiadomienia o problemach technicznych, np. "Maszyna A przestała działać".

3. Zarządzanie Materiałami
   Stan magazynu: Aktualne zapasy surowców i półproduktów.
   Alerty braków: Powiadomienia o niskim poziomie kluczowych materiałów.
   Śledzenie zamówień: Status dostaw surowców.

4. Monitorowanie Pracowników
   Obecność: Lista obecności pracowników na zmianie.
   Czas pracy: Godziny pracy w podziale na zmiany.
   Wydajność zespołu: Produkcja przypadająca na pracownika lub grupę.

5. Harmonogram Produkcji
   Plan produkcji: Co i kiedy ma być produkowane.
   Postęp zadań: Wskaźnik procentowy ukończenia każdego etapu produkcji.
   Zmiany w planie: Historia i uzasadnienie zmian w harmonogramie.

6. Śledzenie Jakości
   Raporty jakości: Ilość wyprodukowanych wadliwych jednostek.
   Kontrole: Wyniki testów jakościowych na poszczególnych etapach produkcji.
   Reklamacje: Liczba i rodzaj zgłoszonych reklamacji przez klientów.

7. Wykresy i Wizualizacje
   Wykresy czasu pracy maszyn: Porównanie czasu pracy w różnych dniach/zmianach.
   Diagramy przepływu produkcji: Ilustracja procesu od surowców do gotowego produktu.
   Wykresy trendów: Analiza wydajności produkcji w czasie.

8. System Alertów
   Powiadomienia na żywo:
   Opóźnienia w produkcji.
   Niski poziom surowców.
   Przekroczone czasy przestoju.
   Kolory priorytetów: Alerty w kolorach np. czerwonym (krytyczne), żółtym (ostrzegawcze).

9. Moduł Analiz
   Raporty finansowe: Koszty produkcji, zyski, ROI.
   Prognozy: Analiza trendów i przewidywanie przyszłych wyników.
   Analiza strat: Przyczyny przestojów lub wadliwości produktów.

10. Integracje
    IoT (Internet of Things): Bezpośrednie połączenie z maszynami produkcyjnymi w celu monitorowania ich stanu.
    System ERP: Synchronizacja z systemami zarządzania przedsiębiorstwem.
    CRM: Dane dotyczące klientów i zamówień.

11. Funkcje Interaktywne
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

## Zmiany w projekcie

1. **Poprawa eksportów w `src/lib/store.jsx`:**

    - Zmieniono eksport z `default` na named exports dla `useAuthStore` i `useStore`.
    - Upewniono się, że wszystkie komponenty importują te hooki jako named exports.

2. **Aktualizacja importów w komponentach:**

    - W każdym komponencie, który korzysta z `useAuthStore` lub `useStore`, poprawiono importy, aby używały named exports.
    - Dotyczy to plików: `EmployeeManagement.jsx`, `SavingsProjects.jsx`, `TaskManagement.jsx`, `navbar.jsx`, `sidebar.jsx`, `dashboard.jsx`, `loginForm.jsx`.

3. **Mockowanie danych:**

    - W `src/lib/store.jsx` i `src/lib/db.js` użyto mockowanych danych, aby aplikacja mogła działać lokalnie bez rzeczywistej bazy danych.

4. **Usunięcie niepotrzebnych importów:**

    - Usunięto nieużywane importy i poprawiono strukturę kodu, aby była bardziej czytelna.

5. **Sprawdzenie i poprawa logiki komponentów:**
    - Upewniono się, że logika w komponentach jest poprawna i nie powoduje błędów w konsoli.

Te zmiany poprawiły stabilność i działanie aplikacji, umożliwiając jej uruchomienie lokalnie bez potrzeby łączenia się z rzeczywistą bazą danych.
