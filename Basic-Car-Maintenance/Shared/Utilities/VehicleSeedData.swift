//
//  VehicleSeedData.swift
//  Basic-Car-Maintenance
//
//  https://github.com/mikaelacaron/Basic-Car-Maintenance
//  See LICENSE for license information.
//
//  Pre-populated vehicle data sourced from BRTA Fitness Certificate FC:23060737
//  Owner: MD. TAHMINUL ISLAM | Registration: DHAKA METRO-GA-24-1096
//

import Foundation

// MARK: - Vehicle

extension Vehicle {
    /// Toyota Corolla Cross (NKE165) registered to the app owner.
    /// Source: BRTA Fitness Certificate FC:23060737
    static let tahminulToyota = Vehicle(
        name: "My Toyota",
        make: "Toyota",
        model: "Corolla Cross",
        year: "2021",
        color: nil,
        vin: "NKE165-724875",
        licensePlateNumber: "DHAKA METRO-GA-24-1096"
    )
}

// MARK: - Maintenance events

extension MaintenanceEvent {

    // Vehicle ID placeholder — replace with the Firestore document ID once the vehicle is saved.
    private static let vehicleID = "NKE165-724875"

    // MARK: Legal / registration

    /// BRTA fitness certificate (ফিটনেস সনদ) FC:23060737 expires 05 March 2028.
    static let brtaFitnessRenewal = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "BRTA Fitness Certificate Renewal",
        date: iso8601("2028-03-05"),
        notes: "Certificate FC:23060737 expires on 05/03/2028. Renew at BRTA before this date to keep the vehicle road-legal. Registration: DHAKA METRO-GA-24-1096."
    )

    // MARK: Engine — 1NZ-FE 1490 cc

    /// Engine oil & filter — 1NZ-FE recommended interval: every 5,000 km or 6 months.
    static let engineOilChange = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Engine Oil & Filter Change",
        date: sixMonthsFromNow(),
        notes: "1NZ-FE engine (1490 cc). Use 5W-30 fully synthetic oil. Capacity: ~3.7 L with filter. Change every 5,000 km or 6 months, whichever comes first."
    )

    /// Spark plugs — 1NZ-FE iridium plugs last ~60,000 km (copper ~30,000 km).
    static let sparkPlugReplacement = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Spark Plug Replacement",
        date: yearsFromNow(3),
        notes: "1NZ-FE engine uses NGK iridium plugs. Replace every 60,000 km. Copper plugs: every 30,000 km."
    )

    /// Air filter — replace every 20,000–30,000 km or annually.
    static let airFilterReplacement = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Air Filter Replacement",
        date: yearsFromNow(1),
        notes: "Engine air filter for 1NZ-FE. Replace every 20,000–30,000 km or annually, more frequently in dusty city conditions (Dhaka)."
    )

    // MARK: Fluids

    /// Coolant flush — every 2 years or 40,000 km.
    static let coolantFlush = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Coolant Flush",
        date: yearsFromNow(2),
        notes: "Toyota Super Long-Life Coolant (pink). Replace every 2 years or 40,000 km."
    )

    /// Brake fluid — hygroscopic; replace every 2 years.
    static let brakeFluidChange = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Brake Fluid Change",
        date: yearsFromNow(2),
        notes: "DOT 3 brake fluid. Replace every 2 years regardless of mileage — brake fluid absorbs moisture over time and lowers its boiling point."
    )

    // MARK: Tyres — 185/60R15

    /// Tyre rotation — every 10,000 km to even out wear across all 4 tyres.
    static let tyreRotation = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Tyre Rotation",
        date: sixMonthsFromNow(),
        notes: "4 × 185/60R15 tyres. Rotate every 10,000 km. Check tread depth (replace below 1.6 mm) and tyre pressure at the same time."
    )

    /// Tyre pressure check — monthly.
    static let tyrePressureCheck = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Tyre Pressure Check",
        date: monthsFromNow(1),
        notes: "185/60R15. Recommended cold tyre pressure: ~32 PSI front and rear. Check monthly and before long trips."
    )

    // MARK: Brakes

    /// Brake pad inspection — every 20,000 km or annually.
    static let brakeInspection = MaintenanceEvent(
        vehicleID: vehicleID,
        title: "Brake Pad & Disc Inspection",
        date: yearsFromNow(1),
        notes: "Inspect front and rear brake pads and discs. Replace pads when thickness drops below 3 mm. Check disc for scoring."
    )

    // MARK: - Helpers

    private static func iso8601(_ dateString: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Asia/Dhaka")
        return formatter.date(from: dateString) ?? Date()
    }

    private static func monthsFromNow(_ months: Int) -> Date {
        Calendar.current.date(byAdding: .month, value: months, to: Date()) ?? Date()
    }

    private static func sixMonthsFromNow() -> Date { monthsFromNow(6) }

    private static func yearsFromNow(_ years: Int) -> Date {
        Calendar.current.date(byAdding: .year, value: years, to: Date()) ?? Date()
    }
}

// MARK: - All events (convenience)

extension MaintenanceEvent {
    /// All pre-populated maintenance events for Tahminul's Toyota, ordered by due date.
    static let allTahminulEvents: [MaintenanceEvent] = [
        tyrePressureCheck,
        engineOilChange,
        tyreRotation,
        airFilterReplacement,
        brakeInspection,
        coolantFlush,
        brakeFluidChange,
        sparkPlugReplacement,
        brtaFitnessRenewal
    ]
}
