## 基础知识
流水线 主要用于并行执行指令，加快CPU的运行速度。
流水线分为多个流水级(stage / segment)，指令从一级到下一级的时间称为processor cycle(通常取决于用时最长的那一级，在CPU中基本为 1 cycle)。
通常可以将指令实现分到五个阶段：
IF (取指 instruction fetch) 将program counter发送到内存，并获取当前指令，通过将PC+4更新到下一条顺序指令。
ID (译码 instruction decode / 获取操作数 register fetch) 指令解码并读取寄存器值、比较branch指令要求的寄存器值、对指令偏移字段做符号位扩展、计算可能得branch目的地址（PC+扩展后的偏移）。（解码同时读取寄存器是因为固定字段编码(fixed-field decoding)，偏移的字段也固定所以也可以同时做符号位扩展）
EX (执行 Execution / effective address) memory reference ALU计算基地址+偏移 r - r  r - i  ALU执行 condition branch 决定条件是否为真。
MEM (访存 Memory access) 使用在EX中计算的effective address去load/store相关数据。
WB (写回 Write-back) 将load的数据或者运算结果写入寄存器文件中
可以看到，分支指令需要 3 cycle，访存指令需要 4 cycle，其余指令需要 5 cycle，假设branch占12%，访存占10%，则不加流水线的CPI为4.66。

简单的流水线示意图：
![image.png](/1.png)
取指和访存可以同时执行的前提是使用I-Cache和D-Cache。(五级流水线要带来五倍的bandwidth增加？
在ID阶段和WB阶段均会用到register，通常前半个cycle写后半个cycle读。(引入寄存器重命名问题等？
通常为了避免不同指令间的相互影响，会在各流水级间插入pipeline registers(同时增加了单个指令的运行时间)。
## hazards
Hazards：阻碍指令在指定的时钟周期内运行。包括三种：
structural hazard：资源冲突导致(例如浮点运算单元用完了之类的？
data hazard：一条指令依赖于前一条指令的结果。
control hazard： branch等改变PC的指令引起。
对于**data hazard**，有三种不同类型危害：RAW  WAW  WAR
其中后两者在简单流水线中不存在，主要存在于重排序后的指令。对于RAW，
add 	x1, x2, x3
sub 	x4, x1, x5
and 	x6, x1, x7
or 	x8, x1, x9
xor 	x10, x1, x11
如以上指令，add需要在cycle 5 将数据写回X1，而sub需要在cycle3即取指阶段读取x1，and需要在cycle4读取，均会产生RAW冲突。对于这类情况，可以采用forwarding(又叫bypassing / short-circuiting)，具体来说就是直接使用pipeline register中的数据。但是如果add指令为load指令，则必须在cycle4才能获取x1，必须将流水线stall一个cycle，有一个 pipeline interlock 来实现。对比如下图：
![image.png](/2.png)

**控制危害**主要由分支指令引起。对于分支指令，如果跳转，成为taken，如果仍是PC+4，称为untaken。
通常在ID段计算偏移地址，在EX段判断跳转条件是否成立，决定是否跳转。
最简单的分支跳转预测方法是，一旦在ID阶段检测到是分支指令（并计算目的地址），就重新取指，如图所示：
![image.png](/3.png)
此外另一个办法是始终假设不跳转，如下图所示(同理可以始终假设跳转)：
![image.png](/4.png)
第四种方法是delay branch，也就是在遇到分支指令时先执行一条无论是否跳转都要执行的指令：
![image.png](/5.png)
以上方法主要是通过编译器静态实现，用于提高有分支指令时的流水线性能。
动态分支预测(Dynamic Branch Prediction)：
使用 2-bit 记录branch的taken状态。
![image.png](/6.png)
## 具体实现
基础实现：在每级流水之间增加流水级寄存器。
![image.png](/7.png)
进一步的，增加mux用于实现forwarding。
![image.png](/8.png)
更进一步的，为了减少分支预测的delay，将目的地址计算提到ID级，将cond计算及比较放在EX级。
通常来说，流水级越长，branch penalty就越大。
![image.png](/9.png)
## 异常处理
异常分类：
![image.png](/10.png)


