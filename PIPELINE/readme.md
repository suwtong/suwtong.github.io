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
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1693617600771-374baf77-dd8b-48c1-825e-00dda9e751b1.png#clientId=ue326e66f-6eac-4&from=paste&height=182&id=u87271ce2&originHeight=273&originWidth=1018&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=174430&status=done&style=none&taskId=ud5f44bcc-026c-40fe-92ef-c7f057921e4&title=&width=678.6666666666666)
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
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1693623026428-add806ea-36a1-4e36-82eb-703b0bcc50fe.png#clientId=ue326e66f-6eac-4&from=paste&height=199&id=ubc9d76d7&originHeight=299&originWidth=1018&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=199019&status=done&style=none&taskId=u5a39ce8f-69a7-491d-a419-20d087e40e3&title=&width=678.6666666666666)

**控制危害**主要由分支指令引起。对于分支指令，如果跳转，成为taken，如果仍是PC+4，称为untaken。
通常在ID段计算偏移地址，在EX段判断跳转条件是否成立，决定是否跳转。
最简单的分支跳转预测方法是，一旦在ID阶段检测到是分支指令（并计算目的地址），就重新取指，如图所示：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1692622337564-db1d99d6-14ef-4dfd-9ef5-95b5084da744.png#clientId=u5a0734b3-68c6-4&from=paste&height=141&id=uff55eb05&originHeight=360&originWidth=1714&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=366363&status=done&style=none&taskId=ucadcc8f6-c940-400d-a981-bc0e83b14a0&title=&width=669)
此外另一个办法是始终假设不跳转，如下图所示(同理可以始终假设跳转)：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1693626418289-5c7aeae5-c87d-4586-b4e8-11d2c63fcb01.png#clientId=ub95098b8-ce53-4&from=paste&height=260&id=u14135ced&originHeight=390&originWidth=1014&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=261912&status=done&style=none&taskId=u68fcaadb-04e6-4a1c-ad60-a01dcd30ea2&title=&width=676)
第四种方法是delay branch，也就是在遇到分支指令时先执行一条无论是否跳转都要执行的指令：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1693626636001-070631a0-8a11-438f-aca2-6bd3ee9e5739.png#clientId=ub95098b8-ce53-4&from=paste&height=260&id=u9cd582d2&originHeight=390&originWidth=1007&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=266207&status=done&style=none&taskId=ucbdaf604-4ce7-40c3-93bf-836358d67b2&title=&width=671.3333333333334)
以上方法主要是通过编译器静态实现，用于提高有分支指令时的流水线性能。
动态分支预测(Dynamic Branch Prediction)：
使用 2-bit 记录branch的taken状态。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1694511444222-72d903f2-8666-4132-9736-f4baf7bee7e1.png#clientId=ued0e2b31-09b8-4&from=paste&height=259&id=u3cb0006f&originHeight=681&originWidth=1109&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=442160&status=done&style=none&taskId=u42b9e1d6-aa3f-4602-9a58-ef72043ab39&title=&width=422.3333435058594)
## 具体实现
基础实现：在每级流水之间增加流水级寄存器。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1694585665650-0b3d8821-9648-4738-9a8c-2037ce88ca87.png#clientId=u27a53f2a-cc82-4&from=paste&height=519&id=u7bb43d3c&originHeight=779&originWidth=1460&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=640797&status=done&style=none&taskId=uc7d08b62-4c13-49a3-b63b-bf07bf72ab6&title=&width=973.3333333333334)
进一步的，增加mux用于实现forwarding。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1694585710353-535b89bb-7e8e-45a4-81ef-416de9c8eb58.png#clientId=u27a53f2a-cc82-4&from=paste&height=390&id=u75f27bf6&originHeight=1107&originWidth=1349&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=807544&status=done&style=none&taskId=uc6bc1585-c4f1-4f69-9309-6e4939e2fc5&title=&width=474.66668701171875)
更进一步的，为了减少分支预测的delay，将目的地址计算提到ID级，将cond计算及比较放在EX级。
通常来说，流水级越长，branch penalty就越大。
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1694585985995-bb7c0c06-1a42-479e-817e-30e66754a4a7.png#clientId=u27a53f2a-cc82-4&from=paste&height=679&id=u088c7616&originHeight=1018&originWidth=1824&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=1011691&status=done&style=none&taskId=u73599dd0-c9f5-46d0-aa5e-b6054184173&title=&width=1216)
## 异常处理
异常分类：
![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2023/png/95956473/1694592022359-59750a06-c5cc-4e3d-9c81-7b84f3cbace8.png#clientId=u0a2190c0-e660-4&from=paste&height=823&id=u493b5873&originHeight=1235&originWidth=1974&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=1572366&status=done&style=none&taskId=ua6250790-e9f5-44e5-a95e-f9dab419bb2&title=&width=1316)


