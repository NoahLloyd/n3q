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

// MARK: - Widget Bundle

@main
struct N3QWidgets: WidgetBundle {
    var body: some Widget {
        N3QEventWidget()
        N3QQuickActionWidget()
        N3QProjectWidget()
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
