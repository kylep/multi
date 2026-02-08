//
//  Item.swift
//  sillyapp
//
//  Created by kp on 2026-02-07.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
