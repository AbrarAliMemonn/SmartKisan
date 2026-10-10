package com.smartagri.controller;

import com.smartagri.service.AgricultureBotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final AgricultureBotService botService;

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body) {
        String message = (String) body.getOrDefault("message", "");
        String language = (String) body.getOrDefault("language", "en");
        List<Map<String, String>> history = (List<Map<String, String>>) body.getOrDefault("history", List.of());

        Map<String, Object> result = botService.processMessage(message, history, language);
        return ResponseEntity.ok(result);
    }

    /**
     * Multimodal Image Diagnosis Endpoint
     * Upload an image of a sick leaf, plant, pest, or soil.
     */
    @PostMapping("/diagnose")
    public ResponseEntity<?> diagnoseCrop(@RequestParam("file") MultipartFile file,
                                          @RequestParam(value = "notes", required = false) String notes,
                                          @RequestParam(value = "language", defaultValue = "en") String language) {
        Map<String, Object> diagnosis = botService.diagnoseCropImage(file, notes, language);
        return ResponseEntity.ok(diagnosis);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam(defaultValue = "en") String language) {
        return ResponseEntity.ok(botService.getSuggestions(language));
    }
}
