#include <emscripten.h>
#include <string>
#include <vector>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int* search(const char* text, const char* w1, const char* w2, int gap, int* resultCount) {
    std::string s(text), word1(w1), word2(w2);
    std::vector<int> positions;
    
    size_t pos = 0;
    while ((pos = s.find(word1, pos)) != std::string::npos) {
        size_t start = pos + word1.length();
        size_t endSearch = std::min(start + (size_t)gap, s.length());

        size_t next = s.find(word2, start);
        if (next != std::string::npos && next <= endSearch) {
            positions.push_back((int)pos);
            positions.push_back((int)(next + word2.length()));
        }
        pos += 1;
    }

    *resultCount = positions.size();
    int* result = (int*)malloc(positions.size() * sizeof(int));
    for (size_t i = 0; i < positions.size(); i++) {
        result[i] = positions[i];
    }
    return result;
}
}
