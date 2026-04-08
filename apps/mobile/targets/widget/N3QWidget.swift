import WidgetKit
import SwiftUI

// MARK: - Shared Data Models

struct WidgetEvent: Codable, Identifiable {
    let id: String
    let title: String
    let date: String
    let time: String?
    let location: String?
}

struct WidgetProject: Codable, Identifiable {
    let id: String
    let title: String
    let status: String
    let memberCount: Int
}

// MARK: - Data Loading

func loadEvents() -> [WidgetEvent] {
    guard let userDefaults = UserDefaults(suiteName: "group.com.n3q.app"),
          let data = userDefaults.string(forKey: "widget_events"),
          let jsonData = data.data(using: .utf8) else { return [] }
    return (try? JSONDecoder().decode([WidgetEvent].self, from: jsonData)) ?? []
}

func loadProjects() -> [WidgetProject] {
    guard let userDefaults = UserDefaults(suiteName: "group.com.n3q.app"),
          let data = userDefaults.string(forKey: "widget_projects"),
          let jsonData = data.data(using: .utf8) else { return [] }
    return (try? JSONDecoder().decode([WidgetProject].self, from: jsonData)) ?? []
}

func statusColor(_ status: String) -> Color {
    switch status {
    case "idea", "looking_for_help": return Color(red: 0.96, green: 0.65, blue: 0.14) // amber
    case "in_progress": return Color(red: 0.38, green: 0.65, blue: 0.98) // blue
    default: return .gray
    }
}

func statusLabel(_ status: String) -> String {
    switch status {
    case "idea": return "Idea"
    case "in_progress": return "In Progress"
    case "looking_for_help": return "Help Wanted"
    case "completed": return "Completed"
    default: return status
    }
}

func formatEventTime(_ time: String?) -> String? {
    guard let time = time else { return nil }
    let parts = time.split(separator: ":")
    guard parts.count >= 2, let hour = Int(parts[0]) else { return time }
    let ampm = hour >= 12 ? "PM" : "AM"
    let h12 = hour % 12 == 0 ? 12 : hour % 12
    return "\(h12):\(parts[1]) \(ampm)"
}

func formatEventDate(_ dateStr: String) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    guard let date = formatter.date(from: dateStr) else { return dateStr }

    let cal = Calendar.current
    if cal.isDateInToday(date) { return "Today" }
    if cal.isDateInTomorrow(date) { return "Tomorrow" }

    let display = DateFormatter()
    display.dateFormat = "MMM d"
    return display.string(from: date)
}

// MARK: - Event Calendar Widget

struct EventEntry: TimelineEntry {
    let date: Date
    let events: [WidgetEvent]
}

struct EventProvider: TimelineProvider {
    func placeholder(in context: Context) -> EventEntry {
        EventEntry(date: Date(), events: [
            WidgetEvent(id: "1", title: "Townhall", date: "2026-04-10", time: "18:00", location: nil)
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (EventEntry) -> Void) {
        completion(EventEntry(date: Date(), events: loadEvents()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<EventEntry>) -> Void) {
        let entry = EventEntry(date: Date(), events: loadEvents())
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct EventWidgetView: View {
    let entry: EventEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("N3Q EVENTS")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundColor(Color(red: 0.96, green: 0.65, blue: 0.14))
                Spacer()
                Link(destination: URL(string: "n3q://(tabs)/events")!) {
                    Text("All ▸")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(.gray)
                }
            }

            if entry.events.isEmpty {
                Spacer()
                Text("No upcoming events")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(.gray)
                Spacer()
            } else {
                ForEach(entry.events.prefix(family == .systemMedium ? 3 : 1)) { event in
                    Link(destination: URL(string: "n3q://(tabs)/events/\(event.id)")!) {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(Color(red: 0.96, green: 0.65, blue: 0.14))
                                .frame(width: 6, height: 6)
                            Text(event.title)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            Spacer()
                            VStack(alignment: .trailing, spacing: 1) {
                                Text(formatEventDate(event.date))
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundColor(.gray)
                                if let time = formatEventTime(event.time) {
                                    Text(time)
                                        .font(.system(size: 10, design: .monospaced))
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .containerBackground(for: .widget) {
            Color(red: 0.04, green: 0.04, blue: 0.04)
        }
    }
}

// MARK: - Quick Actions Widget

struct QuickActionEntry: TimelineEntry {
    let date: Date
}

struct QuickActionProvider: TimelineProvider {
    func placeholder(in context: Context) -> QuickActionEntry { QuickActionEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (QuickActionEntry) -> Void) { completion(QuickActionEntry(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<QuickActionEntry>) -> Void) {
        completion(Timeline(entries: [QuickActionEntry(date: Date())], policy: .never))
    }
}

struct QuickActionWidgetView: View {
    let entry: QuickActionEntry

    var body: some View {
        VStack(spacing: 12) {
            Text("N3Q")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundColor(Color(red: 0.96, green: 0.65, blue: 0.14))

            HStack(spacing: 16) {
                Link(destination: URL(string: "n3q://(tabs)/feed/add")!) {
                    VStack(spacing: 4) {
                        Image(systemName: "book")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                        Text("Post")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                }

                Link(destination: URL(string: "n3q://(tabs)/events/create")!) {
                    VStack(spacing: 4) {
                        Image(systemName: "calendar.badge.plus")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                        Text("Event")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                }

                Link(destination: URL(string: "n3q://(tabs)/projects/create")!) {
                    VStack(spacing: 4) {
                        Image(systemName: "rocket")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                        Text("Project")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                }
            }
        }
        .containerBackground(for: .widget) {
            Color(red: 0.04, green: 0.04, blue: 0.04)
        }
    }
}

// MARK: - Projects Widget

struct ProjectEntry: TimelineEntry {
    let date: Date
    let projects: [WidgetProject]
}

struct ProjectProvider: TimelineProvider {
    func placeholder(in context: Context) -> ProjectEntry {
        ProjectEntry(date: Date(), projects: [
            WidgetProject(id: "1", title: "API Rewrite", status: "in_progress", memberCount: 3)
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (ProjectEntry) -> Void) {
        completion(ProjectEntry(date: Date(), projects: loadProjects()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProjectEntry>) -> Void) {
        let entry = ProjectEntry(date: Date(), projects: loadProjects())
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct ProjectWidgetView: View {
    let entry: ProjectEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("PROJECTS")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundColor(Color(red: 0.96, green: 0.65, blue: 0.14))
                Spacer()
                Link(destination: URL(string: "n3q://(tabs)/projects")!) {
                    Text("All ▸")
                        .font(.system(size: 10, weight: .medium, design: .monospaced))
                        .foregroundColor(.gray)
                }
            }

            if entry.projects.isEmpty {
                Spacer()
                Text("No active projects")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(.gray)
                Spacer()
            } else {
                ForEach(entry.projects.prefix(family == .systemMedium ? 3 : 1)) { project in
                    Link(destination: URL(string: "n3q://(tabs)/projects/\(project.id)")!) {
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(statusColor(project.status))
                                .frame(width: 6, height: 6)
                            Text(project.title)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            Spacer()
                            Text(statusLabel(project.status))
                                .font(.system(size: 10, design: .monospaced))
                                .foregroundColor(statusColor(project.status))
                        }
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .padding(14)
        .containerBackground(for: .widget) {
            Color(red: 0.04, green: 0.04, blue: 0.04)
        }
    }
}

// MARK: - Shared Colors

let amber = Color(red: 0.83, green: 0.66, blue: 0.29) // #d4a84b
let amberDim = Color(red: 0.78, green: 0.61, blue: 0.22) // #c89b37
let gold50 = Color(red: 0.71, green: 0.51, blue: 0.20).opacity(0.5) // rgba(180,130,50,0.5)
let gold25 = Color(red: 0.71, green: 0.51, blue: 0.20).opacity(0.25)
let cardBg = Color(red: 0.10, green: 0.09, blue: 0.06) // #1a1610
let cardBgDark = Color(red: 0.06, green: 0.05, blue: 0.04) // #0f0d0a
let parchmentBg = Color(red: 0.17, green: 0.14, blue: 0.09) // #2c2418

// MARK: - Member Card Widget

struct WidgetProfile: Codable {
    let displayName: String
    let initials: String
    let avatarUrl: String?
    let dayCount: Int
}

func loadProfile() -> WidgetProfile? {
    guard let userDefaults = UserDefaults(suiteName: "group.com.n3q.app"),
          let data = userDefaults.string(forKey: "widget_profile"),
          let jsonData = data.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(WidgetProfile.self, from: jsonData)
}

struct MemberCardEntry: TimelineEntry {
    let date: Date
    let profile: WidgetProfile?
}

struct MemberCardProvider: TimelineProvider {
    func placeholder(in context: Context) -> MemberCardEntry {
        MemberCardEntry(date: Date(), profile: WidgetProfile(
            displayName: "Builder", initials: "B", avatarUrl: nil, dayCount: 42
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (MemberCardEntry) -> Void) {
        completion(MemberCardEntry(date: Date(), profile: loadProfile()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MemberCardEntry>) -> Void) {
        let entry = MemberCardEntry(date: Date(), profile: loadProfile())
        // Refresh at midnight to update day count
        let tomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: Date())!)
        completion(Timeline(entries: [entry], policy: .after(tomorrow)))
    }
}

struct MemberCardWidgetView: View {
    let entry: MemberCardEntry

    var body: some View {
        if let profile = entry.profile {
            Link(destination: URL(string: "n3q://profile")!) {
                ZStack {
                    // Card body gradient
                    LinearGradient(
                        colors: [cardBg, cardBgDark, cardBg],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )

                    // Inner decorative border
                    RoundedRectangle(cornerRadius: 0)
                        .strokeBorder(gold25, lineWidth: 0.5)
                        .padding(8)

                    // Corner diamonds
                    GeometryReader { geo in
                        let inset: CGFloat = 5
                        let size: CGFloat = 5
                        ForEach(0..<4, id: \.self) { i in
                            Rectangle()
                                .fill(Color(red: 0.78, green: 0.61, blue: 0.22).opacity(0.6))
                                .frame(width: size, height: size)
                                .rotationEffect(.degrees(45))
                                .position(
                                    x: i % 2 == 0 ? inset : geo.size.width - inset,
                                    y: i < 2 ? inset : geo.size.height - inset
                                )
                        }
                    }

                    VStack(spacing: 6) {
                        // Avatar
                        ZStack {
                            RoundedRectangle(cornerRadius: 2)
                                .strokeBorder(gold50, lineWidth: 1)
                                .frame(width: 52, height: 52)

                            if let urlStr = profile.avatarUrl, let url = URL(string: urlStr) {
                                // Widget can't load remote images directly; show initials
                                // Remote image loading requires IntentConfiguration + network extension
                                ZStack {
                                    RoundedRectangle(cornerRadius: 1)
                                        .fill(cardBgDark)
                                        .frame(width: 48, height: 48)
                                    Text(profile.initials)
                                        .font(.system(size: 22, weight: .bold, design: .monospaced))
                                        .foregroundColor(amber)
                                }
                            } else {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 1)
                                        .fill(cardBgDark)
                                        .frame(width: 48, height: 48)
                                    Text(profile.initials)
                                        .font(.system(size: 22, weight: .bold, design: .monospaced))
                                        .foregroundColor(amber)
                                }
                            }
                        }

                        // Name
                        Text(profile.displayName.uppercased())
                            .font(.system(size: 11, weight: .semibold, design: .monospaced))
                            .foregroundColor(amber)
                            .lineLimit(1)
                            .tracking(1)

                        // Divider with builder label
                        HStack(spacing: 6) {
                            Rectangle()
                                .fill(gold25)
                                .frame(height: 0.5)
                            Text("BUILDER")
                                .font(.system(size: 7, weight: .medium, design: .monospaced))
                                .foregroundColor(amberDim.opacity(0.6))
                                .tracking(2)
                            Rectangle()
                                .fill(gold25)
                                .frame(height: 0.5)
                        }
                        .padding(.horizontal, 12)

                        // Day count
                        Text("DAY \(profile.dayCount)")
                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                            .foregroundColor(amber)
                            .tracking(3)
                    }
                    .padding(.vertical, 8)
                }
            }
            .containerBackground(for: .widget) {
                Color(red: 0.07, green: 0.06, blue: 0.04)
            }
        } else {
            // Not logged in
            Link(destination: URL(string: "n3q://")!) {
                VStack(spacing: 8) {
                    Text("N3Q")
                        .font(.system(size: 18, weight: .bold, design: .monospaced))
                        .foregroundColor(amber)
                    Text("Open app to\nset up card")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.gray)
                        .multilineTextAlignment(.center)
                }
            }
            .containerBackground(for: .widget) {
                Color(red: 0.04, green: 0.04, blue: 0.04)
            }
        }
    }
}

// MARK: - Brand Widget

struct BrandEntry: TimelineEntry {
    let date: Date
}

struct BrandProvider: TimelineProvider {
    func placeholder(in context: Context) -> BrandEntry { BrandEntry(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (BrandEntry) -> Void) { completion(BrandEntry(date: Date())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<BrandEntry>) -> Void) {
        completion(Timeline(entries: [BrandEntry(date: Date())], policy: .never))
    }
}

struct BrandWidgetView: View {
    let entry: BrandEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Link(destination: URL(string: "n3q://")!) {
            ZStack {
                // Dark card background with subtle gradient
                LinearGradient(
                    colors: [cardBg, cardBgDark, cardBg],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                // Inner decorative border
                RoundedRectangle(cornerRadius: 0)
                    .strokeBorder(gold25, lineWidth: 0.5)
                    .padding(8)

                // Corner diamonds
                GeometryReader { geo in
                    let inset: CGFloat = 5
                    let size: CGFloat = 5
                    ForEach(0..<4, id: \.self) { i in
                        Rectangle()
                            .fill(Color(red: 0.78, green: 0.61, blue: 0.22).opacity(0.6))
                            .frame(width: size, height: size)
                            .rotationEffect(.degrees(45))
                            .position(
                                x: i % 2 == 0 ? inset : geo.size.width - inset,
                                y: i < 2 ? inset : geo.size.height - inset
                            )
                    }
                }

                VStack(spacing: family == .systemMedium ? 10 : 8) {
                    // Logo text
                    Text("N3Q")
                        .font(.system(size: family == .systemMedium ? 28 : 22, weight: .bold, design: .monospaced))
                        .foregroundColor(amber)
                        .tracking(4)

                    // Divider
                    HStack(spacing: 8) {
                        Rectangle().fill(gold25).frame(height: 0.5)
                        Rectangle()
                            .fill(Color(red: 0.78, green: 0.61, blue: 0.22).opacity(0.6))
                            .frame(width: 4, height: 4)
                            .rotationEffect(.degrees(45))
                        Rectangle().fill(gold25).frame(height: 0.5)
                    }
                    .padding(.horizontal, family == .systemMedium ? 40 : 16)

                    // Tagline
                    Text("A lab for builders, backed\nby unicorn founders")
                        .font(.system(size: family == .systemMedium ? 11 : 9, design: .monospaced))
                        .foregroundColor(amberDim.opacity(0.5))
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                        .tracking(0.5)
                }
            }
        }
        .containerBackground(for: .widget) {
            Color(red: 0.07, green: 0.06, blue: 0.04)
        }
    }
}

// MARK: - Widget Bundle

@main
struct N3QWidgets: WidgetBundle {
    var body: some Widget {
        N3QEventWidget()
        N3QQuickActionWidget()
        N3QProjectWidget()
        N3QMemberCardWidget()
        N3QBrandWidget()
    }
}

struct N3QEventWidget: Widget {
    let kind = "N3QEventWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EventProvider()) { entry in
            EventWidgetView(entry: entry)
        }
        .configurationDisplayName("N3Q Events")
        .description("Upcoming events from the community.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct N3QQuickActionWidget: Widget {
    let kind = "N3QQuickActionWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuickActionProvider()) { entry in
            QuickActionWidgetView(entry: entry)
        }
        .configurationDisplayName("N3Q Quick Actions")
        .description("Post, create an event, or start a project.")
        .supportedFamilies([.systemSmall])
    }
}

struct N3QProjectWidget: Widget {
    let kind = "N3QProjectWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ProjectProvider()) { entry in
            ProjectWidgetView(entry: entry)
        }
        .configurationDisplayName("N3Q Projects")
        .description("Active projects and their status.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct N3QMemberCardWidget: Widget {
    let kind = "N3QMemberCardWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MemberCardProvider()) { entry in
            MemberCardWidgetView(entry: entry)
        }
        .configurationDisplayName("Member Card")
        .description("Your N3Q trading card on your home screen.")
        .supportedFamilies([.systemSmall])
    }
}

struct N3QBrandWidget: Widget {
    let kind = "N3QBrandWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BrandProvider()) { entry in
            BrandWidgetView(entry: entry)
        }
        .configurationDisplayName("N3Q")
        .description("A lab for builders, backed by unicorn founders.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
