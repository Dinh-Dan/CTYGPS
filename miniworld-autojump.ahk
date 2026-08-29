; ============================================================
;  Mini World - Tu dong TIEN LEN (W) + NHAY (Space) moi 0.5s
;  Dung cho AutoHotkey v1.x
;
;  CACH DUNG:
;   - Nhan  F8  de BAT / TAT
;   - Nhan  F9  (hoac Esc) de THOAT script
;
;  Khi BAT: giu W lien tuc (chay tien) + nhan Space moi 0.5s
; ============================================================

#NoEnv
#SingleInstance Force
SendMode Input
SetKeyDelay, 0, 30   ; giu phim ~30ms cho game nhan duoc

running := false

; --- F8: bat/tat ---
F8::
    running := !running
    if (running) {
        Send, {w down}          ; giu W (tien len) lien tuc
        SetTimer, DoJump, 500   ; nhay moi 500ms
        ToolTip, ĐÃ BẬT: chạy tiến + nhảy mỗi 0.5s (F8 để tắt)
    } else {
        SetTimer, DoJump, Off
        Send, {w up}            ; nha W
        ToolTip, ĐÃ TẮT (F8 để bật lại)
    }
    SetTimer, HideTip, -1500     ; an tooltip sau 1.5s
return

DoJump:
    Send, {Space down}
    Sleep, 30
    Send, {Space up}
return

HideTip:
    ToolTip
return

; --- Thoat an toan: nha W truoc khi thoat ---
F9::
Esc::
    Send, {w up}
    Send, {Space up}
    ExitApp
return
